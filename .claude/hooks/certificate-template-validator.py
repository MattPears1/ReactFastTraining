#!/usr/bin/env python3
"""
Certificate Template Validator for React Fast Training
Ensures certificate templates meet HSE and Ofqual requirements
"""

import json
import sys
import re
import os
from datetime import datetime

# Required fields for valid certificates
REQUIRED_FIELDS = {
    'attendee_info': [
        'full_name',
        'date_of_birth',  # For unique identification
    ],
    'course_info': [
        'course_title',
        'course_code',  # HSE/Ofqual reference
        'course_duration',
        'course_level',
    ],
    'certification': [
        'certificate_number',  # Unique identifier
        'issue_date',
        'expiry_date',  # First aid certs expire after 3 years
        'qcf_level',  # Qualification level
    ],
    'provider_info': [
        'provider_name',
        'provider_number',  # HSE/Ofqual registration
        'instructor_name',
        'instructor_signature',
    ],
    'regulatory': [
        'hse_approved',  # Health & Safety Executive
        'ofqual_regulated',  # Office of Qualifications
        'certification_body',
    ]
}

# Certificate validation patterns
CERT_PATTERNS = {
    'cert_number_format': r'RFT-\d{4}-\d{6}',  # RFT-YYYY-XXXXXX
    'provider_number': r'HSE-\d{6}|OFQUAL-\d{8}',
    'expiry_period': 1095,  # 3 years in days
}

# Template placeholders that must exist
TEMPLATE_PLACEHOLDERS = [
    '{{attendee_name}}',
    '{{course_title}}',
    '{{certificate_number}}',
    '{{issue_date}}',
    '{{expiry_date}}',
    '{{instructor_name}}',
    '{{provider_number}}',
]

def check_certificate_template(content, file_path):
    """Check certificate template for compliance"""
    issues = []
    warnings = []
    
    # Check for required template placeholders
    if 'certificate' in file_path.lower() or 'template' in file_path.lower():
        missing_placeholders = []
        for placeholder in TEMPLATE_PLACEHOLDERS:
            if placeholder not in content:
                # Also check for variations (e.g., {{ attendee_name }} with spaces)
                placeholder_alt = placeholder.replace('{{', '{{ ').replace('}}', ' }}')
                if placeholder_alt not in content:
                    missing_placeholders.append(placeholder)
        
        if missing_placeholders:
            issues.append({
                'type': 'missing_placeholder',
                'message': f'Missing required placeholders: {", ".join(missing_placeholders)}',
                'severity': 'error'
            })
    
    # Check for certificate number generation
    if re.search(r'(generateCertificate|createCertificate|issueCertificate)', content):
        # Check for proper certificate number format
        if not re.search(CERT_PATTERNS['cert_number_format'], content):
            if not re.search(r'RFT-.*Date.*random|uuid', content, re.IGNORECASE):
                warnings.append({
                    'type': 'cert_number_format',
                    'message': 'Certificate number should follow format: RFT-YYYY-XXXXXX',
                    'severity': 'warning'
                })
        
        # Check for expiry date calculation
        if 'expiry' not in content.lower() and 'expire' not in content.lower():
            issues.append({
                'type': 'missing_expiry',
                'message': 'Certificate generation must include expiry date (3 years)',
                'severity': 'error'
            })
        elif re.search(r'expir.*=.*\+\s*(\d+)', content):
            # Check if expiry period is correct
            match = re.search(r'expir.*\+\s*(\d+)\s*(day|month|year)', content, re.IGNORECASE)
            if match:
                value = int(match.group(1))
                unit = match.group(2).lower()
                if unit == 'year' and value != 3:
                    issues.append({
                        'type': 'incorrect_expiry',
                        'message': 'First aid certificates must expire after exactly 3 years',
                        'severity': 'error'
                    })
    
    # Check for required regulatory text
    if 'certificate' in file_path.lower():
        regulatory_text = [
            ('HSE', 'Health and Safety Executive approved'),
            ('Ofqual', 'Ofqual regulated qualification'),
            ('QCF', 'Qualifications and Credit Framework'),
        ]
        
        for abbr, full_text in regulatory_text:
            if abbr not in content and full_text.lower() not in content.lower():
                warnings.append({
                    'type': 'missing_regulatory',
                    'message': f'Missing regulatory text: {full_text}',
                    'severity': 'warning'
                })
    
    # Check for security features
    if re.search(r'(pdf|PDF|document|template)', content):
        security_features = [
            'watermark',
            'qr_code',
            'verification_url',
            'tamper_proof',
        ]
        
        has_security = any(feature in content.lower() for feature in security_features)
        if not has_security:
            warnings.append({
                'type': 'security_features',
                'message': 'Consider adding security features: QR code, watermark, or verification URL',
                'severity': 'info'
            })
    
    # Check for data validation
    if re.search(r'(validateCertificate|verifyCertificate)', content):
        validations = [
            'attendee_name',
            'course_completion',
            'instructor_qualified',
            'within_expiry',
        ]
        
        missing_validations = []
        for validation in validations:
            if validation not in content.lower().replace('_', ''):
                missing_validations.append(validation)
        
        if missing_validations:
            warnings.append({
                'type': 'incomplete_validation',
                'message': f'Certificate validation should check: {", ".join(missing_validations)}',
                'severity': 'warning'
            })
    
    return issues, warnings

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
        
        # Check certificate-related files
        cert_related = [
            'certificate', 'cert', 'qualification', 'completion',
            'attendee', 'graduate', 'award'
        ]
        
        if not any(term in file_path.lower() for term in cert_related):
            sys.exit(0)
        
        # Get content based on tool type
        if tool_name == 'Write':
            content = tool_input.get('content', '')
        elif tool_name == 'Edit':
            content = tool_input.get('new_string', '')
        else:  # MultiEdit
            content = ' '.join(
                edit.get('new_string', '') 
                for edit in tool_input.get('edits', [])
            )
        
        issues, warnings = check_certificate_template(content, file_path)
        
        # Report issues
        if issues:
            print(f"❌ CERTIFICATE VALIDATION ERRORS in {file_path}:", file=sys.stderr)
            for issue in issues:
                print(f"   • {issue['message']}", file=sys.stderr)
            
            print("\n📋 Certificate Requirements:", file=sys.stderr)
            print("   • Must include unique certificate number (RFT-YYYY-XXXXXX)", file=sys.stderr)
            print("   • Must show 3-year expiry date", file=sys.stderr)
            print("   • Must include HSE approval and Ofqual regulation text", file=sys.stderr)
            print("   • Must have instructor name and signature", file=sys.stderr)
            
            # Block if critical issues
            sys.exit(2)
        
        # Report warnings
        if warnings:
            print(f"⚠️  Certificate Template Warnings for {file_path}:")
            for warning in warnings:
                print(f"   • {warning['message']}")
            
            if any(w['severity'] == 'warning' for w in warnings):
                print("\n💡 Best Practices:")
                print("   • Add QR code for online verification")
                print("   • Include watermark for authenticity")
                print("   • Provide verification URL")
        
        # Success message if it's a certificate file
        if 'certificate' in file_path.lower() and not issues and not warnings:
            print("✅ Certificate template validation passed")
        
        sys.exit(0)
        
    except Exception as e:
        print(f"❌ Certificate validation error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()