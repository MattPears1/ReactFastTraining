#!/usr/bin/env python3
"""
Security checker for React Fast Training project
Validates file modifications against security rules
"""

import json
import sys
import re
import os

# Security patterns to check
SENSITIVE_PATTERNS = {
    'api_keys': [
        r'api[_-]?key\s*[:=]\s*["\']?[a-zA-Z0-9]{20,}',
        r'apiKey\s*[:=]\s*["\']?[a-zA-Z0-9]{20,}',
    ],
    'secrets': [
        r'secret\s*[:=]\s*["\']?[a-zA-Z0-9]{20,}',
        r'password\s*[:=]\s*["\']?[^"\'\s]{8,}',
        r'token\s*[:=]\s*["\']?[a-zA-Z0-9]{20,}',
    ],
    'private_keys': [
        r'-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----',
        r'-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----',
    ],
    'aws_credentials': [
        r'aws_access_key_id\s*=\s*[A-Z0-9]{20}',
        r'aws_secret_access_key\s*=\s*[a-zA-Z0-9/+=]{40}',
    ],
    'database_urls': [
        r'(?:mongodb|postgres|mysql|redis)://[^:]+:[^@]+@[^/]+',
    ]
}

BLOCKED_FILES = [
    '.env',
    '.env.local',
    '.env.production',
    'credentials.json',
    'serviceAccount.json',
    'firebase-admin.json',
]

BLOCKED_PATHS = [
    '.git/',
    'node_modules/',
    'dist/',
    'build/',
    '.claude/secrets/',
]

def check_file_path(file_path):
    """Check if file path is allowed"""
    # Check blocked files
    filename = os.path.basename(file_path)
    if filename in BLOCKED_FILES:
        return False, f"File '{filename}' is in blocked list"
    
    # Check blocked paths
    for blocked_path in BLOCKED_PATHS:
        if blocked_path in file_path:
            return False, f"Path contains blocked directory '{blocked_path}'"
    
    # Check for path traversal
    if '..' in file_path:
        return False, "Path traversal detected"
    
    return True, None

def check_content_security(content):
    """Check content for security issues"""
    issues = []
    
    for category, patterns in SENSITIVE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, content, re.IGNORECASE | re.MULTILINE):
                issues.append(f"Potential {category.replace('_', ' ')} detected")
    
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
        
        # Check file path
        path_ok, path_error = check_file_path(file_path)
        if not path_ok:
            print(f"❌ SECURITY BLOCK: {path_error}", file=sys.stderr)
            sys.exit(2)  # Exit code 2 feeds back to Claude
        
        # For Write and Edit tools, check content
        if tool_name == 'Write':
            content = tool_input.get('content', '')
            issues = check_content_security(content)
            if issues:
                print(f"⚠️  SECURITY WARNING in {file_path}:", file=sys.stderr)
                for issue in issues:
                    print(f"   - {issue}", file=sys.stderr)
                print("\nPlease review and remove sensitive data before proceeding.", file=sys.stderr)
                sys.exit(2)
        
        elif tool_name in ['Edit', 'MultiEdit']:
            # For edits, check the new content
            if tool_name == 'Edit':
                new_content = tool_input.get('new_string', '')
                issues = check_content_security(new_content)
            else:  # MultiEdit
                all_issues = []
                for edit in tool_input.get('edits', []):
                    new_content = edit.get('new_string', '')
                    issues = check_content_security(new_content)
                    all_issues.extend(issues)
                issues = list(set(all_issues))  # Remove duplicates
            
            if issues:
                print(f"⚠️  SECURITY WARNING in {file_path}:", file=sys.stderr)
                for issue in issues:
                    print(f"   - {issue}", file=sys.stderr)
                print("\nPlease review and remove sensitive data before proceeding.", file=sys.stderr)
                sys.exit(2)
        
        # All checks passed
        print(f"✅ Security check passed for {file_path}")
        sys.exit(0)
        
    except Exception as e:
        print(f"❌ Security check error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()