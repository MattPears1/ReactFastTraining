#!/usr/bin/env python3
"""
Form Validation Consistency Checker for React Fast Training
Ensures consistent validation patterns and user feedback across forms
"""

import json
import sys
import re
import os

# Form validation patterns
FORM_PATTERNS = {
    'form_elements': [
        r'<form',
        r'onSubmit',
        r'handleSubmit',
        r'FormProvider',
        r'useForm',
    ],
    'input_elements': [
        r'<input',
        r'<textarea',
        r'<select',
        r'FormField',
        r'TextField',
    ],
    'validation_libraries': [
        r'react-hook-form',
        r'useForm',
        r'register',
        r'formState',
        r'zodResolver',
        r'yupResolver',
    ]
}

# Required validation features
VALIDATION_REQUIREMENTS = {
    'email_fields': {
        'patterns': [r'type=["\']email', r'name=["\']email', r'email.*input'],
        'validations': ['@', 'email', 'valid.*email', 'pattern.*email'],
        'message': 'Email fields must have email validation'
    },
    'phone_fields': {
        'patterns': [r'type=["\']tel', r'name=["\']phone', r'phone.*input'],
        'validations': ['pattern', 'phone.*valid', 'tel.*format'],
        'message': 'Phone fields must have format validation'
    },
    'required_fields': {
        'patterns': [r'required', r'aria-required'],
        'indicators': ['*', 'required', 'mandatory'],
        'message': 'Required fields must have visual indicators'
    }
}

# Error message patterns
ERROR_PATTERNS = {
    'error_display': [
        r'error\s*\.',
        r'errors\[',
        r'formState\.errors',
        r'helperText',
        r'errorMessage',
    ],
    'error_components': [
        r'FormError',
        r'ErrorMessage',
        r'FieldError',
        r'<.*error.*>',
    ]
}

# Accessibility patterns
A11Y_PATTERNS = {
    'labels': [
        r'<label',
        r'htmlFor',
        r'aria-label',
        r'aria-labelledby',
    ],
    'descriptions': [
        r'aria-describedby',
        r'aria-errormessage',
        r'helperText',
    ],
    'states': [
        r'aria-invalid',
        r'aria-required',
        r'disabled',
    ]
}

def check_form_validation(content, file_path):
    """Check for form validation consistency"""
    issues = []
    warnings = []
    
    # Check if file contains forms
    has_form = any(
        re.search(pattern, content, re.IGNORECASE) 
        for pattern in FORM_PATTERNS['form_elements']
    )
    
    if not has_form:
        return issues, warnings
    
    # Check for validation library usage
    uses_validation_lib = any(
        re.search(pattern, content) 
        for pattern in FORM_PATTERNS['validation_libraries']
    )
    
    if not uses_validation_lib:
        warnings.append({
            'type': 'no_validation_library',
            'message': 'Form found without validation library (react-hook-form + zod recommended)',
            'severity': 'warning'
        })
    
    # Check for consistent error handling
    has_error_handling = any(
        re.search(pattern, content) 
        for pattern in ERROR_PATTERNS['error_display']
    )
    
    if not has_error_handling:
        issues.append({
            'type': 'no_error_handling',
            'message': 'Form without error message display',
            'severity': 'error'
        })
    
    # Check specific field validations
    for field_type, requirements in VALIDATION_REQUIREMENTS.items():
        # Check if field type exists
        has_field = any(
            re.search(pattern, content, re.IGNORECASE) 
            for pattern in requirements['patterns']
        )
        
        if has_field:
            # Check if appropriate validation exists
            has_validation = any(
                re.search(validation, content, re.IGNORECASE) 
                for validation in requirements['validations']
            )
            
            if not has_validation:
                issues.append({
                    'type': f'{field_type}_validation_missing',
                    'message': requirements['message'],
                    'severity': 'error'
                })
    
    # Check for input accessibility
    input_matches = re.finditer(r'<input[^>]*>', content)
    for match in input_matches:
        input_tag = match.group(0)
        line_num = content[:match.start()].count('\n') + 1
        
        # Check for label association
        has_id = 'id=' in input_tag
        has_label = any(pattern in input_tag for pattern in ['aria-label', 'aria-labelledby'])
        
        if not has_id and not has_label:
            # Check if there's a label nearby
            context_start = max(0, match.start() - 200)
            context_end = min(len(content), match.end() + 200)
            context = content[context_start:context_end]
            
            if '<label' not in context:
                warnings.append({
                    'type': 'missing_label',
                    'message': f'Input on line {line_num} missing label association',
                    'severity': 'warning',
                    'line': line_num
                })
        
        # Check for error message association
        if 'aria-describedby' not in input_tag and 'aria-errormessage' not in input_tag:
            warnings.append({
                'type': 'missing_error_association',
                'message': f'Input on line {line_num} missing error message association',
                'severity': 'info',
                'line': line_num
            })
    
    # Check for submit button
    if not re.search(r'type=["\']submit|<button[^>]*type=["\']submit', content):
        warnings.append({
            'type': 'missing_submit_button',
            'message': 'Form missing explicit submit button',
            'severity': 'warning'
        })
    
    # Check for form submission handling
    if re.search(r'onSubmit', content):
        # Check for loading state during submission
        if not re.search(r'isSubmitting|submitting|loading.*submit', content, re.IGNORECASE):
            warnings.append({
                'type': 'no_submission_state',
                'message': 'Form submission without loading state',
                'severity': 'warning'
            })
        
        # Check for success feedback
        if not re.search(r'success|toast|notification|redirect', content, re.IGNORECASE):
            warnings.append({
                'type': 'no_success_feedback',
                'message': 'Form submission without success feedback',
                'severity': 'info'
            })
    
    # Check for consistent validation timing
    if uses_validation_lib:
        # Check for mode configuration
        if 'useForm' in content and 'mode:' not in content:
            warnings.append({
                'type': 'no_validation_mode',
                'message': 'useForm without mode configuration (consider mode: "onBlur")',
                'severity': 'info'
            })
    
    # Check for required field indicators
    if re.search(r'required', content):
        if not re.search(r'\\*|required|mandatory', content):
            warnings.append({
                'type': 'no_required_indicator',
                'message': 'Required fields without visual indicators (*)',
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
        
        # Only check relevant files
        if not any(ext in file_path for ext in ['.tsx', '.jsx']):
            sys.exit(0)
        
        # Skip test files
        if any(skip in file_path for skip in ['.test.', '.spec.', '__tests__']):
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
        
        issues, warnings = check_form_validation(content, file_path)
        
        if issues or warnings:
            print(f"📋 FORM VALIDATION REVIEW for {file_path}:")
            
            if issues:
                print("\n❌ Critical Issues:")
                for issue in issues:
                    print(f"  • {issue['message']}")
            
            if warnings:
                print("\n⚠️  Recommendations:")
                for warning in warnings[:5]:  # Limit to 5 warnings
                    msg = f"  • {warning['message']}"
                    if 'line' in warning:
                        msg += f" (line {warning['line']})"
                    print(msg)
            
            print("\n💡 Form Best Practices:")
            print("  • Use react-hook-form with zod for validation")
            print("  • Show inline error messages below fields")
            print("  • Mark required fields with * indicator")
            print("  • Disable submit button during submission")
            print("  • Provide clear success/error feedback")
            print("  • Ensure all inputs have accessible labels")
        
        sys.exit(0)
        
    except Exception as e:
        print(f"❌ Form validation check error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()