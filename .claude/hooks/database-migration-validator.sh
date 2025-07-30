#!/bin/bash
# Database Migration Validator for React Fast Training
# Ensures migrations are safe, reversible, and follow best practices

PROJECT_DIR="$CLAUDE_PROJECT_DIR"
FILES="$CLAUDE_FILE_PATHS"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$PROJECT_DIR"

check_migration_file() {
    local file="$1"
    local issues_found=false
    
    echo -e "${BLUE}🗄️  Validating migration: $(basename $file)${NC}"
    
    # Check for up and down methods
    if grep -E "export.*up.*async" "$file" > /dev/null; then
        echo -e "${GREEN}✅ Up migration found${NC}"
    else
        echo -e "${RED}❌ Missing 'up' migration method${NC}"
        issues_found=true
    fi
    
    if grep -E "export.*down.*async" "$file" > /dev/null; then
        echo -e "${GREEN}✅ Down migration found${NC}"
    else
        echo -e "${RED}❌ Missing 'down' migration method - migrations must be reversible${NC}"
        issues_found=true
    fi
    
    # Check for destructive operations without safeguards
    if grep -E "(DROP TABLE|DROP COLUMN|DELETE FROM)" "$file" > /dev/null; then
        echo -e "${YELLOW}⚠️  Destructive operations detected:${NC}"
        grep -n -E "(DROP TABLE|DROP COLUMN|DELETE FROM)" "$file"
        
        # Check if there's a backup or safety check
        if ! grep -E "(backup|safety|confirm|transaction)" "$file" > /dev/null; then
            echo -e "${RED}   → Consider adding data backup before destructive operations${NC}"
            issues_found=true
        fi
    fi
    
    # Check for proper transaction handling
    if grep -E "(BEGIN|START TRANSACTION)" "$file" > /dev/null || grep -E "trx\.|transaction" "$file" > /dev/null; then
        echo -e "${GREEN}✅ Transaction handling detected${NC}"
    else
        # Check if migration has multiple operations
        operation_count=$(grep -E "(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)" "$file" | wc -l)
        if [ $operation_count -gt 1 ]; then
            echo -e "${YELLOW}⚠️  Multiple operations without transaction wrapper${NC}"
            echo -e "   → Consider wrapping in a transaction for atomicity${NC}"
        fi
    fi
    
    # Check for index creation on large tables
    if grep -E "CREATE.*INDEX" "$file" > /dev/null; then
        if ! grep -E "(CONCURRENTLY|IF NOT EXISTS)" "$file" > /dev/null; then
            echo -e "${YELLOW}⚠️  Index creation without CONCURRENTLY clause${NC}"
            echo -e "   → May lock table during creation${NC}"
        fi
    fi
    
    # Check for NOT NULL without defaults on existing tables
    if grep -E "ALTER.*ADD.*COLUMN.*NOT NULL" "$file" > /dev/null; then
        if ! grep -E "(DEFAULT|USING)" "$file" > /dev/null; then
            echo -e "${RED}❌ Adding NOT NULL column without default value${NC}"
            echo -e "   → Will fail if table has existing data${NC}"
            issues_found=true
        fi
    fi
    
    # Check for proper timestamp handling
    if grep -E "(created_at|updated_at|timestamp)" "$file" > /dev/null; then
        if ! grep -E "(DEFAULT.*CURRENT_TIMESTAMP|DEFAULT.*now\(\))" "$file" > /dev/null; then
            echo -e "${YELLOW}💡 Consider adding default timestamps${NC}"
        fi
    fi
    
    # Check for foreign key constraints
    if grep -E "(REFERENCES|FOREIGN KEY)" "$file" > /dev/null; then
        if ! grep -E "(ON DELETE|ON UPDATE)" "$file" > /dev/null; then
            echo -e "${YELLOW}⚠️  Foreign key without CASCADE rules${NC}"
            echo -e "   → Define ON DELETE/UPDATE behavior${NC}"
        fi
    fi
    
    # Check for data migrations
    if grep -E "(INSERT|UPDATE).*SELECT" "$file" > /dev/null; then
        echo -e "${YELLOW}📊 Data migration detected${NC}"
        if ! grep -E "(WHERE|LIMIT|batch)" "$file" > /dev/null; then
            echo -e "${YELLOW}   → Consider batching large data operations${NC}"
        fi
    fi
    
    # Check for proper column types
    if grep -E "(VARCHAR\(255\)|TEXT)" "$file" > /dev/null; then
        echo -e "${YELLOW}💡 Review column types:${NC}"
        echo -e "   → VARCHAR(255) might be arbitrary, consider actual needs${NC}"
        echo -e "   → TEXT for truly unbounded content only${NC}"
    fi
    
    # Validate migration naming
    local filename=$(basename "$file")
    if [[ ! $filename =~ ^[0-9]{14}[_-].+\.(js|ts|sql)$ ]]; then
        echo -e "${YELLOW}⚠️  Non-standard migration filename format${NC}"
        echo -e "   → Expected: YYYYMMDDHHMMSS_description.{js|ts|sql}${NC}"
    fi
    
    return $([ "$issues_found" = true ] && echo 1 || echo 0)
}

check_schema_consistency() {
    local file="$1"
    
    # For schema or model files
    if [[ $file =~ (schema|model|entity)\.(ts|js)$ ]]; then
        echo -e "${BLUE}📋 Checking schema consistency...${NC}"
        
        # Check that model matches migration patterns
        if grep -E "(booking|session|course|user|venue)" "$file" > /dev/null; then
            echo -e "${GREEN}✅ Core entity schema detected${NC}"
            
            # Check for required audit fields
            audit_fields=("created_at" "updated_at")
            for field in "${audit_fields[@]}"; do
                if ! grep -E "$field" "$file" > /dev/null; then
                    echo -e "${YELLOW}⚠️  Missing audit field: $field${NC}"
                fi
            done
            
            # Check for soft delete support
            if grep -E "(delete|remove)" "$file" > /dev/null; then
                if ! grep -E "(deleted_at|is_deleted|active)" "$file" > /dev/null; then
                    echo -e "${YELLOW}💡 Consider soft delete pattern${NC}"
                fi
            fi
        fi
    fi
}

# Main execution
TOTAL_ISSUES=0

for file in $FILES; do
    # Check migration files
    if [[ $file =~ migration.*\.(js|ts|sql)$ ]] || [[ $file =~ migrations/.*\.(js|ts|sql)$ ]]; then
        check_migration_file "$file"
        if [ $? -eq 1 ]; then
            ((TOTAL_ISSUES++))
        fi
        echo ""
    fi
    
    # Check schema files
    if [[ $file =~ (schema|model|entity)\.(ts|js)$ ]]; then
        check_schema_consistency "$file"
        echo ""
    fi
done

# Check for migration conflicts if multiple migration files
migration_files=$(echo "$FILES" | grep -E "migration.*\.(js|ts|sql)$" | wc -l)
if [ $migration_files -gt 1 ]; then
    echo -e "${YELLOW}⚠️  Multiple migrations in single change${NC}"
    echo -e "   → Consider if these should be combined${NC}"
    echo -e "   → Ensure proper execution order${NC}"
fi

# Summary
echo -e "${YELLOW}📊 Migration Validation Summary:${NC}"
echo -e "Best Practices:"
echo -e "  • Always include both up() and down() methods"
echo -e "  • Wrap multiple operations in transactions"
echo -e "  • Use IF EXISTS/IF NOT EXISTS clauses"
echo -e "  • Add defaults when adding NOT NULL columns"
echo -e "  • Consider performance impact on large tables"
echo -e "  • Test rollback scenarios"

if [ $TOTAL_ISSUES -gt 0 ]; then
    echo -e "\n${RED}❌ Found $TOTAL_ISSUES critical issues - please fix before proceeding${NC}"
    exit 2  # Block execution
else
    echo -e "\n${GREEN}✅ Migration validation passed${NC}"
    exit 0
fi