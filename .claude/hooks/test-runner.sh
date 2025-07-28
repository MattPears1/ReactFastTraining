#!/bin/bash
# Automated test runner hook for React Fast Training

# Get the modified files
FILES="$CLAUDE_FILE_PATHS"
PROJECT_DIR="$CLAUDE_PROJECT_DIR"

cd "$PROJECT_DIR"

# Check if any test files were modified
if echo "$FILES" | grep -E "\.(test|spec)\.(ts|tsx|js|jsx)$" > /dev/null; then
    echo "🧪 Running tests for modified test files..."
    npm test -- --findRelatedTests $FILES --passWithNoTests
    exit $?
fi

# Check if any source files were modified that might have tests
if echo "$FILES" | grep -E "src/.*\.(ts|tsx|js|jsx)$" | grep -v "\.(test|spec)\." > /dev/null; then
    # Extract just the filename without extension to find related tests
    for file in $FILES; do
        if [[ $file == src/* ]] && [[ ! $file == *.test.* ]] && [[ ! $file == *.spec.* ]]; then
            base_name=$(basename "$file" | sed -E 's/\.(ts|tsx|js|jsx)$//')
            dir_name=$(dirname "$file")
            
            # Look for corresponding test files
            test_patterns=(
                "${dir_name}/__tests__/${base_name}.test.*"
                "${dir_name}/__tests__/${base_name}.spec.*"
                "${dir_name}/${base_name}.test.*"
                "${dir_name}/${base_name}.spec.*"
            )
            
            for pattern in "${test_patterns[@]}"; do
                if ls $pattern 2>/dev/null | head -1 > /dev/null; then
                    echo "🧪 Found tests for $file, running..."
                    npm test -- --findRelatedTests $file --passWithNoTests
                    break
                fi
            done
        fi
    done
fi

echo "✅ Test check complete"