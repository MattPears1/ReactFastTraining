#!/usr/bin/env python3
"""
Payment Security Validator for React Fast Training
Ensures PCI DSS compliance and secure payment handling
"""

import json
import sys
import re
import os

# PCI DSS prohibited patterns
PROHIBITED_PATTERNS = {
    'card_numbers': [
        r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',  # Card number pattern
        r'\b\d{16}\b',  # 16 digits together
        r'card[_-]?number.*\d{4,}',
        r'credit[_-]?card.*\d{4,}',
    ],
    'cvv_codes': [
        r'\bcvv\s*[:=]\s*\d{3,4}\b',
        r'\bcvc\s*[:=]\s*\d{3,4}\b',
        r'\bsecurity[_-]?code\s*[:=]\s*\d{3,4}\b',
        r'\b\d{3}\b.*cvv',
        r'\b\d{3,4}\b.*security.*code',
    ],
    'sensitive_storage': [
        r'localStorage.*card',
        r'sessionStorage.*card',
        r'cookie.*card',
        r'localStorage.*cvv',
        r'sessionStorage.*payment',
    ]
}

# Required security patterns
SECURITY_REQUIREMENTS = {
    'payment_providers': [
        'stripe',
        'paypal',
        'square',
        'worldpay',
        'sagepay',
    ],
    'secure_elements': [
        'CardElement',
        'PaymentElement',
        'loadStripe',
        'StripeProvider',
        'Elements',
    ],
    'security_headers': [
        'Content-Security-Policy',
        'X-Frame-Options',
        'Strict-Transport-Security',
    ]
}

# Payment form patterns
PAYMENT_PATTERNS = {
    'payment_forms': [
        r'payment.*form',
        r'checkout.*form',
        r'billing.*form',
        r'CardForm',
        r'PaymentForm',
        r'CheckoutForm',
    ],
    'payment_processing': [
        r'processPayment',
        r'handlePayment',
        r'submitPayment',
        r'createPaymentIntent',
        r'confirmPayment',
    ]
}

def check_payment_security(content, file_path):
    """Check for payment security compliance"""
    issues = []
    warnings = []
    
    # Check if file handles payments
    handles_payments = any(
        re.search(pattern, content, re.IGNORECASE) 
        for patterns in PAYMENT_PATTERNS.values()
        for pattern in patterns
    )
    
    if not handles_payments:
        # Still check for card data in any file
        for category, patterns in PROHIBITED_PATTERNS.items():
            for pattern in patterns:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    issues.append({
                        'type': 'prohibited_data',
                        'category': category,
                        'message': f'Potential {category.replace("_", " ")} found on line {line_num}',
                        'severity': 'critical',
                        'line': line_num,
                        'match': match.group(0)[:30] + '...' if len(match.group(0)) > 30 else match.group(0)
                    })
        return issues, warnings
    
    # File handles payments - check for security
    
    # Check for direct card handling
    direct_card_handling = [
        r'<input[^>]*name=["\']card[_-]?number',
        r'<input[^>]*name=["\']cvv',
        r'<input[^>]*name=["\']cvc',
        r'cardNumber\s*[:=]',
        r'cvv\s*[:=]',
    ]
    
    for pattern in direct_card_handling:
        if re.search(pattern, content, re.IGNORECASE):
            issues.append({
                'type': 'direct_card_handling',
                'message': 'Direct card data handling detected - use payment provider tokens',
                'severity': 'critical',
                'suggestion': 'Use Stripe Elements or similar tokenization'
            })
            break
    
    # Check for payment provider usage
    uses_payment_provider = any(
        provider in content.lower() 
        for provider in SECURITY_REQUIREMENTS['payment_providers']
    )
    
    if not uses_payment_provider:
        issues.append({
            'type': 'no_payment_provider',
            'message': 'Payment handling without recognized payment provider',
            'severity': 'critical',
            'suggestion': 'Use Stripe, PayPal, or other PCI-compliant provider'
        })
    
    # Check for secure elements (Stripe specific)
    if 'stripe' in content.lower():
        uses_secure_elements = any(
            element in content 
            for element in SECURITY_REQUIREMENTS['secure_elements']
        )
        
        if not uses_secure_elements:
            warnings.append({
                'type': 'no_secure_elements',
                'message': 'Stripe integration without secure Elements',
                'severity': 'warning',
                'suggestion': 'Use Stripe Elements for card input'
            })
    
    # Check for HTTPS enforcement
    if re.search(r'(http://|ws://)', content):
        issues.append({
            'type': 'insecure_protocol',
            'message': 'Non-HTTPS protocol in payment context',
            'severity': 'critical'
        })
    
    # Check for logging/debugging
    log_patterns = [
        r'console\.log.*card',
        r'console\.log.*payment',
        r'console\.log.*cvv',
        r'debug.*card',
        r'logger.*payment.*details',
    ]
    
    for pattern in log_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            issues.append({
                'type': 'payment_data_logging',
                'message': 'Potential payment data logging detected',
                'severity': 'critical',
                'suggestion': 'Never log payment details, even in development'
            })
            break
    
    # Check for client-side validation only
    if re.search(r'(validate|check).*card.*number', content, re.IGNORECASE):
        if not re.search(r'(server|backend|api).*validat', content, re.IGNORECASE):
            warnings.append({
                'type': 'client_validation_only',
                'message': 'Card validation appears to be client-side only',
                'severity': 'warning',
                'suggestion': 'Always validate payments server-side'
            })
    
    # Check for error handling
    if re.search(r'catch.*payment|payment.*error', content, re.IGNORECASE):
        # Check for sensitive data in errors
        if re.search(r'error.*card.*number|error.*cvv', content, re.IGNORECASE):
            issues.append({
                'type': 'sensitive_error_data',
                'message': 'Error messages may contain sensitive payment data',
                'severity': 'critical'
            })
    else:
        warnings.append({
            'type': 'no_payment_error_handling',
            'message': 'Payment processing without explicit error handling',
            'severity': 'warning'
        })
    
    # Check for SSL/TLS mentions
    if 'payment' in content.lower() and 'form' in content.lower():
        if not re.search(r'(ssl|tls|https|secure)', content, re.IGNORECASE):
            warnings.append({
                'type': 'no_security_mention',
                'message': 'Payment form without security assurance to users',
                'severity': 'info',
                'suggestion': 'Display security badges or SSL information'
            })
    
    # Check for PCI compliance mentions
    if not re.search(r'(pci|pci-dss|payment.*card.*industry)', content, re.IGNORECASE):
        warnings.append({
            'type': 'no_pci_mention',
            'message': 'Consider mentioning PCI DSS compliance',
            'severity': 'info'
        })
    
    # Check for recurring payment handling
    if re.search(r'(subscription|recurring|auto.*renew)', content, re.IGNORECASE):
        if not re.search(r'(cancel|unsubscribe|stop.*payment)', content, re.IGNORECASE):
            warnings.append({
                'type': 'no_cancellation_option',
                'message': 'Recurring payments without clear cancellation option',
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
        
        issues, warnings = check_payment_security(content, file_path)
        
        if issues:
            print(f"🔒 PAYMENT SECURITY VIOLATIONS in {file_path}:", file=sys.stderr)
            
            critical_issues = [i for i in issues if i['severity'] == 'critical']
            
            for issue in critical_issues:
                print(f"\n❌ CRITICAL: {issue['message']}", file=sys.stderr)
                if 'line' in issue:
                    print(f"   Line {issue['line']}: {issue.get('match', '')}", file=sys.stderr)
                if 'suggestion' in issue:
                    print(f"   → {issue['suggestion']}", file=sys.stderr)
            
            print("\n🚨 PCI DSS Requirements:", file=sys.stderr)
            print("  • NEVER store card numbers, CVV, or PIN", file=sys.stderr)
            print("  • Use tokenization (Stripe, PayPal, etc.)", file=sys.stderr)
            print("  • Always use HTTPS for payment pages", file=sys.stderr)
            print("  • Never log payment details", file=sys.stderr)
            print("  • Implement server-side validation", file=sys.stderr)
            
            # Block execution for critical issues
            sys.exit(2)
        
        if warnings:
            print(f"⚠️  Payment Security Warnings for {file_path}:")
            for warning in warnings[:5]:
                print(f"  • {warning['message']}")
                if 'suggestion' in warning:
                    print(f"    → {warning['suggestion']}")
        
        sys.exit(0)
        
    except Exception as e:
        print(f"❌ Payment security check error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()