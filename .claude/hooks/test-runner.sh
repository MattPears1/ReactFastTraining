#!/bin/bash
# Enhanced automated test runner hook for React Fast Training
# Intelligently runs tests based on file changes

# Get the modified files
FILES="$CLAUDE_FILE_PATHS"
PROJECT_DIR="$CLAUDE_PROJECT_DIR"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cd "$PROJECT_DIR"

# Check if test framework is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found, skipping tests${NC}"
    exit 0
fi

# Track test execution
TESTS_RUN=false
TEST_RESULTS=0

# Function to run tests with proper error handling
run_tests() {
    local test_files="$1"
    local test_type="$2"
    
    echo -e "${YELLOW}🧪 Running ${test_type} tests...${NC}"
    
    # Check if Jest is configured
    if [ -f "jest.config.js" ] || [ -f "jest.config.ts" ] || [ -f "package.json" ]; then
        npm test -- --findRelatedTests $test_files --passWithNoTests --silent 2>&1 | tee /tmp/test-output.log
        local result=${PIPESTATUS[0]}
        
        # Parse test output for summary
        if grep -q "PASS" /tmp/test-output.log; then
            echo -e "${GREEN}✅ Tests passed${NC}"
        elif grep -q "FAIL" /tmp/test-output.log; then
            echo -e "${RED}❌ Some tests failed${NC}"
            grep -A 5 "FAIL" /tmp/test-output.log | head -20
        fi
        
        TESTS_RUN=true
        return $result
    else
        echo -e "${YELLOW}⚠️  No Jest configuration found${NC}"
        return 0
    fi
}

# Check if any test files were modified
if echo "$FILES" | grep -E "\.(test|spec)\.(ts|tsx|js|jsx)$" > /dev/null; then
    test_files=$(echo "$FILES" | grep -E "\.(test|spec)\.(ts|tsx|js|jsx)$")
    run_tests "$test_files" "modified"
    TEST_RESULTS=$?
fi

# Check if any source files were modified that might have tests
if echo "$FILES" | grep -E "src/.*\.(ts|tsx|js|jsx)$" | grep -v "\.(test|spec)\." > /dev/null; then
    source_files=$(echo "$FILES" | grep -E "src/.*\.(ts|tsx|js|jsx)$" | grep -v "\.(test|spec)\.")
    
    # Collect all related test files
    related_tests=""
    
    for file in $source_files; do
        if [[ $file == src/* ]] && [[ ! $file == *.test.* ]] && [[ ! $file == *.spec.* ]]; then
            base_name=$(basename "$file" | sed -E 's/\.(ts|tsx|js|jsx)$//')
            dir_name=$(dirname "$file")
            
            # Enhanced test file patterns
            test_patterns=(
                "${dir_name}/__tests__/${base_name}.test.*"
                "${dir_name}/__tests__/${base_name}.spec.*"
                "${dir_name}/${base_name}.test.*"
                "${dir_name}/${base_name}.spec.*"
                "${dir_name}/../__tests__/${base_name}.test.*"
                "${dir_name}/../__tests__/${base_name}.spec.*"
                # Component-specific patterns
                "${dir_name}/__tests__/${base_name}/**/*.test.*"
                "${dir_name}/__tests__/${base_name}/**/*.spec.*"
            )
            
            for pattern in "${test_patterns[@]}"; do
                found_tests=$(find . -path "$pattern" 2>/dev/null | head -5)
                if [ -n "$found_tests" ]; then
                    related_tests="$related_tests $found_tests"
                fi
            done
        fi
    done
    
    # Run all related tests at once if any were found
    if [ -n "$related_tests" ]; then
        echo -e "${YELLOW}📁 Found related tests for source files${NC}"
        run_tests "$source_files" "related"
        TEST_RESULTS=$?
    else
        echo -e "${YELLOW}ℹ️  No related tests found for modified source files${NC}"
    fi
fi

# Check for backend-specific tests
if echo "$FILES" | grep -E "backend-loopback4/.*\.(ts|js)$" > /dev/null; then
    echo -e "${YELLOW}🔧 Backend files modified, checking for backend tests...${NC}"
    
    if [ -d "backend-loopback4" ] && [ -f "backend-loopback4/package.json" ]; then
        cd backend-loopback4
        if npm run test 2>&1 | grep -E "(PASS|FAIL|Error)"; then
            TESTS_RUN=true
        fi
        cd ..
    fi
fi

# Summary
if [ "$TESTS_RUN" = true ]; then
    if [ $TEST_RESULTS -eq 0 ]; then
        echo -e "${GREEN}✅ All test checks passed${NC}"
    else
        echo -e "${RED}⚠️  Some tests failed - please review${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  No tests were run (no test files found or modified)${NC}"
fi

# Clean up
rm -f /tmp/test-output.log

exit $TEST_RESULTS