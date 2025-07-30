#!/usr/bin/env python3
"""
GDPR Compliance Checker for React Fast Training
Ensures personal data handling follows GDPR requirements
"""

import json
import sys
import re
import os

# GDPR-related patterns to check
GDPR_PATTERNS = {
    'personal_data_collection': {
        'patterns': [
            r'(name|email|phone|address|dob|dateOfBirth)\s*[:=]\s*["\']?',
            r'(firstName|lastName|fullName|phoneNumber)\s*[:=]\s*["\']?',
            r'personal(Data|Info|Information)',
            r'user(Data|Info|Profile)',
        ],
        'message': 'Personal data collection detected'
    },
    'missing_consent': {
        'patterns': [
            r'<input[^>]+type=["\']?(email|tel|text)["\']?(?![^>]+consent)',
            r'<form(?![^>]+consent)',
            r'collectUserData\s*\([^)]*\)(?!.*checkConsent)',
        ],
        'message': 'Data collection without explicit consent check'
    },
    'data_retention': {
        'patterns': [
            r'localStorage\.setItem.*personal',
            r'sessionStorage\.setItem.*user',
            r'cookie.*=.*email',
            r'document\.cookie.*=.*(?:name|phone|address)',
        ],
        'message': 'Personal data storage without retention policy'
    },
    'third_party_sharing': {
        'patterns': [
            r'fetch\(["\'][^"\']*(?:analytics|tracking|facebook|google)[^"\']*["\'].*user',
            r'gtag\s*\(["\']event.*email',
            r'fbq\s*\(["\']track.*personal',
        ],
        'message': 'Potential personal data sharing with third parties'
    },
    'missing_privacy_link': {
        'patterns': [
            r'<form(?![\s\S]*privacy[\s\S]*</form>)',
            r'newsletter(?![\s\S]{0,200}privacy)',
            r'subscribe(?![\s\S]{0,200}privacy)',
        ],
        'message': 'Form without privacy policy link'
    },
    'data_deletion': {
        'patterns': [
            r'deleteUser(?!.*deletePersonalData)',
            r'removeAccount(?!.*removeAllData)',
            r'cancelSubscription(?!.*deleteData)',
        ],
        'message': 'User deletion without ensuring data removal'
    }
}

# Files that should have GDPR considerations
GDPR_CRITICAL_PATHS = [
    'components/booking',
    'components/auth',
    'components/contact',
    'pages/ContactPage',
    'admin/features/users',
    'services/api',
]

# Required GDPR elements
REQUIRED_ELEMENTS = {
    'ContactForm': ['privacy policy checkbox', 'consent text'],
    'BookingForm': ['data usage explanation', 'consent checkbox'],
    'NewsletterSignup': ['unsubscribe info', 'privacy link'],
    'UserProfile': ['data export option', 'deletion option'],
}

def check_gdpr_compliance(content, file_path):
    """Check content for GDPR compliance issues"""
    issues = []
    
    # Check for personal data handling patterns
    for category, config in GDPR_PATTERNS.items():
        for pattern in config['patterns']:
            matches = list(re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE))
            if matches:
                # Skip if it's properly handled
                for match in matches:
                    line_start = content.rfind('\n', 0, match.start()) + 1
                    line_end = content.find('\n', match.end())
                    if line_end == -1:
                        line_end = len(content)
                    line = content[line_start:line_end]
                    
                    # Check for GDPR compliance indicators nearby
                    context_start = max(0, line_start - 500)
                    context_end = min(len(content), line_end + 500)
                    context = content[context_start:context_end]
                    
                    compliance_indicators = [
                        'consent', 'gdpr', 'privacy', 'dataProtection',
                        'lawfulBasis', 'optIn', 'agree', 'terms'
                    ]
                    
                    has_compliance = any(
                        indicator in context.lower() 
                        for indicator in compliance_indicators
                    )
                    
                    if not has_compliance:
                        line_num = content[:match.start()].count('\n') + 1
                        issues.append({
                            'category': category,
                            'message': config['message'],
                            'line': line_num,
                            'text': line.strip()[:80]
                        })
                        break  # Only report once per category
    
    # Check if critical files have required GDPR elements
    for component, requirements in REQUIRED_ELEMENTS.items():
        if component.lower() in file_path.lower():
            for req in requirements:
                if req.lower().replace(' ', '') not in content.lower().replace(' ', ''):
                    issues.append({
                        'category': 'missing_requirement',
                        'message': f'Missing required GDPR element: {req}',
                        'line': 0,
                        'text': f'Component {component} must include {req}'
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
        
        # Skip non-relevant files
        if not any(path in file_path for path in GDPR_CRITICAL_PATHS):
            # Quick check for any personal data patterns in other files
            if tool_name == 'Write':
                content = tool_input.get('content', '')
            elif tool_name == 'Edit':
                content = tool_input.get('new_string', '')
            else:  # MultiEdit
                content = ' '.join(
                    edit.get('new_string', '') 
                    for edit in tool_input.get('edits', [])
                )
            
            # Basic check for personal data in non-critical files
            personal_data_keywords = [
                'email', 'phone', 'address', 'name', 'dob',
                'creditCard', 'bankAccount', 'passport'
            ]
            
            if any(keyword in content.lower() for keyword in personal_data_keywords):
                print(f"📋 GDPR Notice: Personal data handling detected in {file_path}")
                print("   Ensure proper consent and data protection measures are in place")
        else:
            # Detailed check for critical paths
            if tool_name == 'Write':
                content = tool_input.get('content', '')
            else:
                # For edits, we'd need to check the full file context
                # For now, check the new content
                if tool_name == 'Edit':
                    content = tool_input.get('new_string', '')
                else:  # MultiEdit
                    content = ' '.join(
                        edit.get('new_string', '') 
                        for edit in tool_input.get('edits', [])
                    )
            
            issues = check_gdpr_compliance(content, file_path)
            
            if issues:
                print(f"⚠️  GDPR COMPLIANCE ISSUES in {file_path}:", file=sys.stderr)
                for issue in issues[:5]:  # Limit to first 5 issues
                    print(f"   Line {issue['line']}: {issue['message']}", file=sys.stderr)
                    if issue['text']:
                        print(f"     → {issue['text']}", file=sys.stderr)
                
                print("\n📋 GDPR Requirements:", file=sys.stderr)
                print("   - Obtain explicit consent before collecting personal data", file=sys.stderr)
                print("   - Include privacy policy links near data collection", file=sys.stderr)
                print("   - Implement data deletion capabilities", file=sys.stderr)
                print("   - Document lawful basis for data processing", file=sys.stderr)
                
                # Don't block, just warn
                sys.exit(0)
        
        sys.exit(0)
        
    except Exception as e:
        print(f"❌ GDPR compliance check error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()