#!/bin/bash
# Dependency security and update checker for React Fast Training

PROJECT_DIR="$CLAUDE_PROJECT_DIR"
FILES="$CLAUDE_FILE_PATHS"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$PROJECT_DIR"

# Check if package.json was modified
if echo "$FILES" | grep -E "package\.json$" > /dev/null; then
    echo -e "${BLUE}📦 Package.json modified - running dependency checks...${NC}"
    
    # Check for security vulnerabilities
    echo -e "${YELLOW}🔒 Checking for security vulnerabilities...${NC}"
    
    if command -v npm &> /dev/null; then
        audit_output=$(npm audit --json 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            vulnerabilities=$(echo "$audit_output" | jq '.metadata.vulnerabilities // {}')
            total=$(echo "$vulnerabilities" | jq '.total // 0')
            
            if [ "$total" -gt 0 ]; then
                high=$(echo "$vulnerabilities" | jq '.high // 0')
                critical=$(echo "$vulnerabilities" | jq '.critical // 0')
                
                if [ "$critical" -gt 0 ] || [ "$high" -gt 0 ]; then
                    echo -e "${RED}❌ Found $critical critical and $high high severity vulnerabilities!${NC}"
                    echo -e "${RED}Run 'npm audit fix' to attempt automatic fixes${NC}"
                else
                    moderate=$(echo "$vulnerabilities" | jq '.moderate // 0')
                    low=$(echo "$vulnerabilities" | jq '.low // 0')
                    echo -e "${YELLOW}⚠️  Found $moderate moderate and $low low severity vulnerabilities${NC}"
                fi
            else
                echo -e "${GREEN}✅ No security vulnerabilities found${NC}"
            fi
        fi
    fi
    
    # Check for outdated packages
    echo -e "${YELLOW}📊 Checking for outdated packages...${NC}"
    
    # Get outdated packages
    outdated=$(npm outdated --json 2>/dev/null || echo "{}")
    outdated_count=$(echo "$outdated" | jq 'length')
    
    if [ "$outdated_count" -gt 0 ]; then
        echo -e "${YELLOW}📦 Found $outdated_count outdated packages:${NC}"
        echo "$outdated" | jq -r 'to_entries | .[] | "\(.key): \(.value.current) → \(.value.wanted) (latest: \(.value.latest))"' | head -10
        
        # Check for major version updates
        major_updates=$(echo "$outdated" | jq -r 'to_entries | .[] | select(.value.current | split(".")[0] != (.value.latest | split(".")[0])) | .key' | wc -l)
        if [ "$major_updates" -gt 0 ]; then
            echo -e "${YELLOW}⚠️  $major_updates packages have major version updates available${NC}"
        fi
    else
        echo -e "${GREEN}✅ All packages are up to date${NC}"
    fi
    
    # Check for duplicate dependencies
    echo -e "${YELLOW}🔍 Checking for duplicate dependencies...${NC}"
    
    if [ -f "package-lock.json" ]; then
        # Simple check for packages that appear multiple times with different versions
        duplicates=$(jq -r '.dependencies | to_entries | .[] | .key' package-lock.json 2>/dev/null | sort | uniq -d | head -5)
        
        if [ -n "$duplicates" ]; then
            echo -e "${YELLOW}⚠️  Potential duplicate dependencies detected:${NC}"
            echo "$duplicates"
        else
            echo -e "${GREEN}✅ No duplicate dependencies found${NC}"
        fi
    fi
    
    # Check for unused dependencies
    echo -e "${YELLOW}🧹 Checking for potentially unused dependencies...${NC}"
    
    # Get all dependencies from package.json
    if [ -f "package.json" ]; then
        deps=$(jq -r '.dependencies // {} | keys[]' package.json 2>/dev/null)
        unused_deps=""
        
        for dep in $deps; do
            # Skip common framework dependencies that might not be directly imported
            if [[ ! "$dep" =~ ^(@types/|react|react-dom|next|vite|typescript)$ ]]; then
                # Check if the dependency is imported anywhere in the src directory
                if ! grep -r "from ['\"]$dep" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v node_modules > /dev/null; then
                    unused_deps="$unused_deps $dep"
                fi
            fi
        done
        
        if [ -n "$unused_deps" ]; then
            echo -e "${YELLOW}⚠️  Potentially unused dependencies:${NC}"
            echo "$unused_deps" | tr ' ' '\n' | grep -v '^$' | head -5
            echo -e "${YELLOW}   (Verify before removing - some may be used indirectly)${NC}"
        else
            echo -e "${GREEN}✅ All dependencies appear to be in use${NC}"
        fi
    fi
fi

# Check for backend dependencies if backend files were modified
if echo "$FILES" | grep -E "backend-loopback4/.*package\.json$" > /dev/null; then
    echo -e "\n${BLUE}🔧 Backend package.json modified - checking backend dependencies...${NC}"
    
    cd backend-loopback4
    
    # Similar checks for backend
    audit_output=$(npm audit --json 2>/dev/null)
    if [ $? -eq 0 ]; then
        vulnerabilities=$(echo "$audit_output" | jq '.metadata.vulnerabilities.total // 0')
        if [ "$vulnerabilities" -gt 0 ]; then
            echo -e "${YELLOW}⚠️  Backend has $vulnerabilities vulnerabilities${NC}"
        else
            echo -e "${GREEN}✅ Backend dependencies are secure${NC}"
        fi
    fi
    
    cd ..
fi

echo -e "\n${GREEN}✅ Dependency check complete${NC}"