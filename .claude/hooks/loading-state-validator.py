#!/usr/bin/env python3
"""
Loading State Validator for React Fast Training
Ensures proper loading states and error boundaries for async operations
"""

import json
import sys
import re
import os

# Patterns for async operations that need loading states
ASYNC_PATTERNS = {
    'fetch_calls': [
        r'fetch\s*\(',
        r'axios\.',
        r'\.get\s*\(',
        r'\.post\s*\(',
        r'\.put\s*\(',
        r'\.delete\s*\(',
    ],
    'async_hooks': [
        r'useQuery',
        r'useMutation',
        r'useSWR',
        r'useAsync',
    ],
    'async_functions': [
        r'async\s+function',
        r'async\s*\(',
        r'async\s*=>',
    ],
    'promises': [
        r'\.then\s*\(',
        r'Promise\.',
        r'await\s+',
    ]
}

# Loading state patterns
LOADING_PATTERNS = [
    r'[iI]sLoading',
    r'[lL]oading',
    r'[iI]sFetching',
    r'[pP]ending',
    r'[lL]oadingState',
]

# Error handling patterns
ERROR_PATTERNS = [
    r'catch\s*\(',
    r'\.catch\s*\(',
    r'error\s*[=:]',
    r'[eE]rror[sS]tate',
    r'hasError',
    r'onError',
]

# UI feedback patterns
UI_FEEDBACK = {
    'loading_ui': [
        r'Spinner',
        r'Skeleton',
        r'LoadingIndicator',
        r'CircularProgress',
        r'<.*[lL]oading.*>',
    ],
    'error_ui': [
        r'ErrorBoundary',
        r'ErrorMessage',
        r'Alert.*error',
        r'<.*[eE]rror.*>',
    ]
}

def check_loading_states(content, file_path):
    """Check for proper loading state handling"""
    issues = []
    
    # Skip test files
    if any(skip in file_path for skip in ['.test.', '.spec.', 'mock', '__tests__']):
        return issues
    
    # Check if file has async operations
    has_async = False
    async_operations = []
    
    for category, patterns in ASYNC_PATTERNS.items():
        for pattern in patterns:
            matches = re.findall(pattern, content)
            if matches:
                has_async = True
                async_operations.extend(matches)
    
    if not has_async:
        return issues  # No async operations, no need for loading states
    
    # Check for loading state management
    has_loading_state = any(
        re.search(pattern, content) for pattern in LOADING_PATTERNS
    )
    
    if not has_loading_state:
        issues.append({
            'type': 'missing_loading_state',
            'message': f'Async operations found but no loading state management',
            'severity': 'error',
            'operations': async_operations[:3]  # First 3 operations
        })
    
    # Check for error handling
    has_error_handling = any(
        re.search(pattern, content) for pattern in ERROR_PATTERNS
    )
    
    if not has_error_handling:
        issues.append({
            'type': 'missing_error_handling',
            'message': 'Async operations without error handling',
            'severity': 'error'
        })
    
    # Check for UI feedback
    has_loading_ui = any(
        re.search(pattern, content) for pattern in UI_FEEDBACK['loading_ui']
    )
    
    if has_loading_state and not has_loading_ui:
        issues.append({
            'type': 'missing_loading_ui',
            'message': 'Loading state exists but no loading UI component',
            'severity': 'warning'
        })
    
    # Check for error UI
    has_error_ui = any(
        re.search(pattern, content) for pattern in UI_FEEDBACK['error_ui']
    )
    
    if has_error_handling and not has_error_ui:
        issues.append({
            'type': 'missing_error_ui',
            'message': 'Error handling exists but no error UI component',
            'severity': 'warning'
        })
    
    # Check for proper async/await usage
    if re.search(r'async\s+', content):
        # Check for forgotten await
        promise_calls = re.findall(r'(\w+)\s*\(.*\)(?!\s*\.then|\s*\.catch|await)', content)
        for call in promise_calls:
            if any(async_word in call.lower() for async_word in ['fetch', 'get', 'post', 'save', 'load']):
                line_match = re.search(rf'{call}\s*\(', content)
                if line_match:
                    line_num = content[:line_match.start()].count('\n') + 1
                    issues.append({
                        'type': 'missing_await',
                        'message': f'Possible missing await for {call}()',
                        'severity': 'warning',
                        'line': line_num
                    })
    
    # Check for loading state reset
    if has_loading_state:
        # Check if loading is set to false in finally or after operations
        if not re.search(r'(finally|setLoading\s*\(\s*false|loading\s*=\s*false)', content):
            issues.append({
                'type': 'loading_state_not_reset',
                'message': 'Loading state might not be reset after operation',
                'severity': 'warning'
            })
    
    return issues

def main():
    try:
        # Read input from Claude
        input_data = json.load(sys.stdin)
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        
        # Only check file modification tools
        if tool_name not in ['Edit', 'MultiEdit', 'Write']:
            sys.exit(0)
        
        file_path = tool_input.get('file_path', '')
        
        # Only check React component files
        if not any(ext in file_path for ext in ['.tsx', '.jsx']):
            sys.exit(0)
        
        # Get content
        if tool_name == 'Write':
            content = tool_input.get('content', '')
        elif tool_name == 'Edit':
            content = tool_input.get('new_string', '')
        else:  # MultiEdit
            content = '\n'.join(
                edit.get('new_string', '') 
                for edit in tool_input.get('edits', [])
            )
        
        issues = check_loading_states(content, file_path)
        
        if issues:
            print(f"⏳ LOADING STATE ISSUES in {file_path}:")
            
            errors = [i for i in issues if i['severity'] == 'error']
            warnings = [i for i in issues if i['severity'] == 'warning']
            
            if errors:
                print("\n❌ Errors:")
                for issue in errors:
                    print(f"  • {issue['message']}")
                    if 'operations' in issue:
                        print(f"    Found: {', '.join(issue['operations'][:3])}")
            
            if warnings:
                print("\n⚠️  Warnings:")
                for issue in warnings:
                    print(f"  • {issue['message']}")
                    if 'line' in issue:
                        print(f"    Line {issue['line']}")
            
            print("\n💡 Best Practices:")
            print("  • Always show loading indicators during async operations")
            print("  • Handle errors gracefully with user-friendly messages")
            print("  • Use try-catch-finally to ensure loading states are reset")
            print("  • Consider using React Suspense for data fetching")
        
        sys.exit(0)
        
    except Exception as e:
        print(f"❌ Loading state validation error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()