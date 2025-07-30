#!/bin/bash

# Database Improvements Migration Script
# Created: 2025-01-28
# Purpose: Safely apply database improvements to production

set -e  # Exit on any error

echo "================================================"
echo "React Fast Training - Database Improvements"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable is not set${NC}"
    echo "Please set DATABASE_URL to your PostgreSQL connection string"
    exit 1
fi

# Function to run SQL file
run_sql_file() {
    local file=$1
    local description=$2
    
    echo -e "\n${YELLOW}Running: ${description}${NC}"
    echo "File: ${file}"
    
    if [ -f "$file" ]; then
        psql "$DATABASE_URL" < "$file"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Success: ${description}${NC}"
        else
            echo -e "${RED}✗ Failed: ${description}${NC}"
            exit 1
        fi
    else
        echo -e "${RED}✗ File not found: ${file}${NC}"
        exit 1
    fi
}

# Confirm before proceeding
echo -e "\n${YELLOW}This script will apply the following database improvements:${NC}"
echo "1. Corporate clients table and B2B features"
echo "2. Certificate renewal reminders system"
echo "3. Course categories for better organization"
echo "4. Instructor availability tracking"
echo "5. Enhanced venue information"
echo "6. Performance indexes"
echo "7. Data integrity constraints"

echo -e "\n${YELLOW}Target Database:${NC}"
# Extract and display database info (hide password)
DB_INFO=$(echo "$DATABASE_URL" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')
echo "$DB_INFO"

echo -e "\n${RED}WARNING: This will modify your database structure!${NC}"
read -p "Do you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

# Create backup reminder
echo -e "${YELLOW}Have you backed up your database? (Recommended)${NC}"
read -p "Continue without backup? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Please backup your database first:"
    echo "heroku pg:backups:capture --app react-fast-training"
    exit 0
fi

# Change to correct directory
cd "$(dirname "$0")/.."
echo "Working directory: $(pwd)"

# Run migrations in order
echo -e "\n${GREEN}Starting database improvements...${NC}"

# Check if update_updated_at_column function exists
echo -e "\n${YELLOW}Checking for required functions...${NC}"
psql "$DATABASE_URL" -c "SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column';" | grep -q 1
if [ $? -ne 0 ]; then
    echo "Creating update_updated_at_column function..."
    psql "$DATABASE_URL" <<EOF
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
\$\$ language 'plpgsql';
EOF
fi

# Apply migrations
run_sql_file "src/db/migrations/008_corporate_and_renewals.sql" "Corporate clients and renewal reminders"
run_sql_file "src/db/migrations/009_instructor_availability.sql" "Instructor availability tracking"

# Verify new tables were created
echo -e "\n${YELLOW}Verifying new tables...${NC}"
psql "$DATABASE_URL" -c "\dt corporate_clients,renewal_reminders,course_categories,instructor_availability" | grep -E "(corporate_clients|renewal_reminders|course_categories|instructor_availability)"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ All new tables created successfully${NC}"
else
    echo -e "${RED}✗ Some tables may not have been created${NC}"
fi

# Show summary
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}Database improvements applied successfully!${NC}"
echo -e "${GREEN}================================================${NC}"

echo -e "\n${YELLOW}New features available:${NC}"
echo "• B2B corporate client management"
echo "• Automated certificate renewal reminders"
echo "• Course categorization system"
echo "• Instructor availability tracking"
echo "• Enhanced venue information"
echo "• Improved query performance"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Test the new features in your application"
echo "2. Update admin panel to manage corporate clients"
echo "3. Configure renewal reminder email templates"
echo "4. Set up instructor availability schedules"

echo -e "\n${GREEN}Migration completed successfully!${NC}"