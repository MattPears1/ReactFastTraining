#!/bin/bash
# Comprehensive linting and code quality checks for React Fast Training

PROJECT_DIR="$CLAUDE_PROJECT_DIR"
FILES="$CLAUDE_FILE_PATHS"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$PROJECT_DIR"

echo -e "${YELLOW}🔍 Running comprehensive code quality checks...${NC}"

ISSUES_FOUND=false

# TypeScript type checking
if echo "$FILES" | grep -E "\.(ts|tsx)$" > /dev/null; then
    echo -e "${YELLOW}📘 TypeScript type checking...${NC}"
    
    ts_files=$(echo "$FILES" | grep -E "\.(ts|tsx)$")
    tsc_output=$(npx tsc --noEmit --skipLibCheck $ts_files 2>&1)
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ TypeScript errors found:${NC}"
        echo "$tsc_output" | grep -E "error TS" | head -10
        ISSUES_FOUND=true
    else
        echo -e "${GREEN}✅ TypeScript check passed${NC}"
    fi
fi

# ESLint checking with auto-fix disabled for reporting
if echo "$FILES" | grep -E "\.(js|jsx|ts|tsx)$" > /dev/null; then
    echo -e "${YELLOW}🎨 ESLint checking...${NC}"
    
    js_files=$(echo "$FILES" | grep -E "\.(js|jsx|ts|tsx)$")
    eslint_output=$(npx eslint $js_files --format compact 2>&1)
    
    if echo "$eslint_output" | grep -E "[0-9]+ problem" > /dev/null; then
        echo -e "${RED}❌ ESLint issues found:${NC}"
        echo "$eslint_output" | grep -E "(error|warning)" | head -10
        ISSUES_FOUND=true
    else
        echo -e "${GREEN}✅ ESLint check passed${NC}"
    fi
fi

# Import checking for unused imports
if echo "$FILES" | grep -E "\.(ts|tsx|js|jsx)$" > /dev/null; then
    echo -e "${YELLOW}📦 Checking for unused imports...${NC}"
    
    for file in $FILES; do
        if [[ $file =~ \.(ts|tsx|js|jsx)$ ]]; then
            # Simple check for imports that aren't used
            imports=$(grep -E "^import .* from" "$file" | sed -E 's/import \{?([^}]*)\}? from.*/\1/' | tr ',' '\n' | tr -d ' ')
            unused=""
            
            for import in $imports; do
                # Skip type imports and default imports
                if [[ ! $import =~ ^type ]] && [[ -n $import ]]; then
                    # Check if the import is used in the file (exclude the import line)
                    if ! grep -v "^import" "$file" | grep -q "$import"; then
                        unused="$unused $import"
                    fi
                fi
            done
            
            if [ -n "$unused" ]; then
                echo -e "${YELLOW}⚠️  Potentially unused imports in $file:$unused${NC}"
            fi
        fi
    done
fi

# CSS/Tailwind class checking
if echo "$FILES" | grep -E "\.(tsx|jsx)$" > /dev/null; then
    echo -e "${YELLOW}🎨 Checking Tailwind classes...${NC}"
    
    # Check for duplicate or conflicting Tailwind classes
    for file in $FILES; do
        if [[ $file =~ \.(tsx|jsx)$ ]]; then
            # Check for className with potential issues
            if grep -E 'className=.*".*"' "$file" | grep -E '(px-[0-9]+ +px-[0-9]+|py-[0-9]+ +py-[0-9]+|m-[0-9]+ +m-[0-9]+)' > /dev/null; then
                echo -e "${YELLOW}⚠️  Potential duplicate Tailwind classes in $file${NC}"
            fi
        fi
    done
fi

# Accessibility checking for React components
if echo "$FILES" | grep -E "\.(tsx|jsx)$" > /dev/null; then
    echo -e "${YELLOW}♿ Checking accessibility...${NC}"
    
    for file in $FILES; do
        if [[ $file =~ \.(tsx|jsx)$ ]]; then
            # Check for images without alt text
            if grep -E '<img[^>]+src=' "$file" | grep -v 'alt=' > /dev/null; then
                echo -e "${RED}❌ Image without alt text in $file${NC}"
                ISSUES_FOUND=true
            fi
            
            # Check for buttons/links without accessible text
            if grep -E '<(button|a)[^>]*>\s*</(button|a)>' "$file" > /dev/null; then
                echo -e "${RED}❌ Empty button or link in $file${NC}"
                ISSUES_FOUND=true
            fi
            
            # Check for form inputs without labels
            if grep -E '<input[^>]+type="(text|email|password|number)"' "$file" > /dev/null; then
                if ! grep -B5 -A5 '<input[^>]+type="(text|email|password|number)"' "$file" | grep -E '(label|aria-label)' > /dev/null; then
                    echo -e "${YELLOW}⚠️  Input possibly missing label in $file${NC}"
                fi
            fi
        fi
    done
fi

# Performance checks
if echo "$FILES" | grep -E "\.(tsx|jsx)$" > /dev/null; then
    echo -e "${YELLOW}⚡ Checking for performance issues...${NC}"
    
    for file in $FILES; do
        if [[ $file =~ \.(tsx|jsx)$ ]]; then
            # Check for large inline functions in JSX
            if grep -E 'on[A-Z][a-zA-Z]*=\{.*=>.*\}' "$file" | grep -E '.{100,}' > /dev/null; then
                echo -e "${YELLOW}⚠️  Large inline function in JSX in $file (consider extracting)${NC}"
            fi
            
            # Check for missing React.memo on functional components
            if grep -E '^(export )?(const|function) [A-Z][a-zA-Z]*.*=.*\(.*\).*=>' "$file" > /dev/null; then
                component_name=$(grep -E '^(export )?(const|function) [A-Z][a-zA-Z]*' "$file" | head -1 | sed -E 's/.*(const|function) ([A-Z][a-zA-Z]*).*/\2/')
                if ! grep -E "(React\.memo\($component_name\)|memo\($component_name\))" "$file" > /dev/null; then
                    echo -e "${YELLOW}💡 Component $component_name in $file could benefit from React.memo${NC}"
                fi
            fi
        fi
    done
fi

# Summary
echo -e "\n${YELLOW}📊 Code Quality Summary:${NC}"
if [ "$ISSUES_FOUND" = true ]; then
    echo -e "${RED}❌ Issues found - please review and fix${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All quality checks passed!${NC}"
    exit 0
fi