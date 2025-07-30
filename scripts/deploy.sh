#!/bin/bash

# Heroku Deployment Script
# This script handles zero-downtime deployments to Heroku

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME=${HEROKU_APP_NAME:-"lex-business"}
STAGING_APP="${APP_NAME}-staging"
PRODUCTION_APP="${APP_NAME}-production"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        log_error "Heroku CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if logged in to Heroku
    if ! heroku auth:whoami &> /dev/null; then
        log_error "Not logged in to Heroku. Please run 'heroku login' first."
        exit 1
    fi
    
    # Check if git is clean
    if [[ -n $(git status -s) ]]; then
        log_warning "Git working directory is not clean. Commit or stash changes before deploying."
        exit 1
    fi
    
    log_info "Prerequisites check passed."
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Frontend tests
    npm test -- --run
    
    # Backend tests
    cd backend && npm test
    cd ..
    
    log_info "All tests passed."
}

# Build application
build_app() {
    log_info "Building application..."
    
    # Build frontend
    npm run build:full
    
    # Build backend
    cd backend && npm run build
    cd ..
    
    log_info "Build completed successfully."
}

# Deploy to staging
deploy_staging() {
    log_info "Deploying to staging environment..."
    
    # Push to staging
    git push heroku-staging main:main
    
    # Run database migrations
    heroku run npm run migrate:prod --app $STAGING_APP
    
    # Verify deployment
    heroku ps --app $STAGING_APP
    
    log_info "Staging deployment completed."
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests on staging..."
    
    STAGING_URL=$(heroku info -s --app $STAGING_APP | grep web_url | cut -d= -f2)
    
    # Health check
    if ! curl -f "${STAGING_URL}health" > /dev/null 2>&1; then
        log_error "Health check failed on staging"
        exit 1
    fi
    
    # API health check
    if ! curl -f "${STAGING_URL}api/health" > /dev/null 2>&1; then
        log_error "API health check failed on staging"
        exit 1
    fi
    
    log_info "Smoke tests passed."
}

# Deploy to production
deploy_production() {
    log_info "Deploying to production..."
    
    # Enable maintenance mode
    heroku maintenance:on --app $PRODUCTION_APP
    
    # Backup database
    log_info "Creating database backup..."
    heroku pg:backups:capture --app $PRODUCTION_APP
    
    # Push to production
    git push heroku-production main:main
    
    # Run database migrations
    heroku run npm run migrate:prod --app $PRODUCTION_APP
    
    # Disable maintenance mode
    heroku maintenance:off --app $PRODUCTION_APP
    
    # Scale dynos
    heroku ps:scale web=2 worker=1 --app $PRODUCTION_APP
    
    log_info "Production deployment completed."
}

# Rollback deployment
rollback() {
    log_warning "Rolling back deployment..."
    
    # Get previous release
    PREVIOUS_RELEASE=$(heroku releases --app $PRODUCTION_APP | grep "Deploy" | sed -n 2p | awk '{print $1}')
    
    # Rollback to previous release
    heroku rollback $PREVIOUS_RELEASE --app $PRODUCTION_APP
    
    # Rollback database if needed
    read -p "Rollback database? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        heroku run npm run migrate:undo --app $PRODUCTION_APP
    fi
    
    log_info "Rollback completed."
}

# Monitor deployment
monitor_deployment() {
    log_info "Monitoring deployment..."
    
    # Tail logs
    heroku logs --tail --app $PRODUCTION_APP &
    LOG_PID=$!
    
    # Monitor for 5 minutes
    sleep 300
    
    # Stop tailing logs
    kill $LOG_PID
    
    # Check error rate
    ERROR_COUNT=$(heroku logs --app $PRODUCTION_APP --num 1000 | grep -c "ERROR" || true)
    
    if [ $ERROR_COUNT -gt 10 ]; then
        log_warning "High error rate detected: $ERROR_COUNT errors in last 1000 log lines"
        read -p "Continue with deployment? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            rollback
            exit 1
        fi
    fi
    
    log_info "Deployment monitoring completed."
}

# Main deployment flow
main() {
    case "${1:-}" in
        "staging")
            check_prerequisites
            run_tests
            build_app
            deploy_staging
            run_smoke_tests
            ;;
        "production")
            check_prerequisites
            run_tests
            build_app
            deploy_staging
            run_smoke_tests
            
            log_info "Staging deployment successful. Proceeding to production..."
            read -p "Deploy to production? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                deploy_production
                monitor_deployment
            else
                log_warning "Production deployment cancelled."
            fi
            ;;
        "rollback")
            rollback
            ;;
        *)
            echo "Usage: $0 {staging|production|rollback}"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"