#!/usr/bin/env python3
"""
Pricing Consistency and Course Duration Validator for React Fast Training
Ensures consistent pricing and course duration across the codebase
"""

import json
import sys
import re
import os

# Business constants from requirements
COURSE_PRICING = {
    'EFAW': {'price': 75, 'duration': 6, 'name': 'Emergency First Aid at Work'},
    'FAW': {'price': None, 'duration': 6, 'name': 'First Aid at Work'},  # Price TBD
    'PAEDIATRIC': {'price': None, 'duration': 6, 'name': 'Paediatric First Aid'},
}

# Valid duration values (in hours)
VALID_DURATIONS = [6, 12, 18]  # 6 hours (1 day), 12 hours (2 days), 18 hours (3 days)

# Pricing patterns to check
PRICING_PATTERNS = {
    'hardcoded_prices': [
        r'£\d+',
        r'price["\']?\s*[:=]\s*\d+',
        r'cost["\']?\s*[:=]\s*\d+',
        r'fee["\']?\s*[:=]\s*\d+',
        r'amount["\']?\s*[:=]\s*\d+',
    ],
    'currency_symbols': [
        r'£',
        r'GBP',
        r'pounds?',
    ],
    'duration_patterns': [
        r'duration["\']?\s*[:=]\s*["\']?\d+',
        r'hours?["\']?\s*[:=]\s*["\']?\d+',
        r'days?["\']?\s*[:=]\s*["\']?\d+',
        r'\d+\s*hours?',
        r'\d+\s*days?',
    ]
}

# Configuration file patterns
CONFIG_PATTERNS = [
    'config',
    'constants',
    'settings',
    'prices',
    'courses',
]

def extract_price_value(text):
    """Extract numeric price value from text"""
    match = re.search(r'(\d+(?:\.\d{2})?)', text)
    if match:
        return float(match.group(1))
    return None

def extract_duration_value(text):
    """Extract duration value from text"""
    # Check for hours
    hours_match = re.search(r'(\d+)\s*hours?', text, re.IGNORECASE)
    if hours_match:
        return int(hours_match.group(1))
    
    # Check for days (convert to hours)
    days_match = re.search(r'(\d+)\s*days?', text, re.IGNORECASE)
    if days_match:
        return int(days_match.group(1)) * 6  # Assuming 6 hours per day
    
    # Check for direct numeric value
    num_match = re.search(r'[:=]\s*["\']?(\d+)', text)
    if num_match:
        return int(num_match.group(1))
    
    return None

def check_pricing_consistency(content, file_path):
    """Check for pricing and duration consistency"""
    issues = []
    warnings = []
    
    # Check if it's a configuration file
    is_config_file = any(pattern in file_path.lower() for pattern in CONFIG_PATTERNS)
    
    # Find all price references
    found_prices = []
    for pattern in PRICING_PATTERNS['hardcoded_prices']:
        matches = re.finditer(pattern, content, re.IGNORECASE)
        for match in matches:
            line_num = content[:match.start()].count('\n') + 1
            price_text = match.group(0)
            price_value = extract_price_value(price_text)
            
            if price_value:
                found_prices.append({
                    'value': price_value,
                    'text': price_text,
                    'line': line_num
                })
    
    # Check for hardcoded prices outside config files
    if found_prices and not is_config_file:
        for price_info in found_prices:
            # Check if it matches known course prices
            matches_known = False
            for course, info in COURSE_PRICING.items():
                if info['price'] and price_info['value'] == info['price']:
                    matches_known = True
                    warnings.append({
                        'type': 'hardcoded_price',
                        'message': f"Hardcoded price £{price_info['value']} on line {price_info['line']} - use config",
                        'severity': 'warning',
                        'line': price_info['line'],
                        'suggestion': f'Import from config: COURSE_PRICES.{course}'
                    })
                    break
            
            if not matches_known and price_info['value'] > 20:  # Ignore small values
                warnings.append({
                    'type': 'unknown_price',
                    'message': f"Unknown price £{price_info['value']} on line {price_info['line']}",
                    'severity': 'info',
                    'line': price_info['line']
                })
    
    # Check course durations
    found_durations = []
    for pattern in PRICING_PATTERNS['duration_patterns']:
        matches = re.finditer(pattern, content, re.IGNORECASE)
        for match in matches:
            line_num = content[:match.start()].count('\n') + 1
            duration_text = match.group(0)
            duration_value = extract_duration_value(duration_text)
            
            if duration_value:
                found_durations.append({
                    'value': duration_value,
                    'text': duration_text,
                    'line': line_num
                })
    
    # Validate durations
    for duration_info in found_durations:
        duration = duration_info['value']
        
        # Check if it's a valid course duration
        if duration not in VALID_DURATIONS and duration > 0:
            # Check if it's talking about course duration
            context_start = max(0, content.rfind('\n', 0, content.find(duration_info['text'])) - 100)
            context_end = min(len(content), content.find(duration_info['text']) + 100)
            context = content[context_start:context_end].lower()
            
            if any(word in context for word in ['course', 'training', 'session', 'class']):
                issues.append({
                    'type': 'invalid_duration',
                    'message': f"Invalid course duration {duration} hours on line {duration_info['line']}",
                    'severity': 'error',
                    'line': duration_info['line'],
                    'suggestion': f'Valid durations: {", ".join(map(str, VALID_DURATIONS))} hours'
                })
    
    # Check for VAT handling
    if re.search(r'price|cost|fee|amount', content, re.IGNORECASE):
        if not re.search(r'vat|tax|inclusive|exclusive', content, re.IGNORECASE):
            warnings.append({
                'type': 'no_vat_mention',
                'message': 'Price display without VAT clarification',
                'severity': 'info',
                'suggestion': 'Clarify if prices include VAT'
            })
    
    # Check for currency formatting
    if '£' in content:
        # Check for consistent decimal places
        price_formats = re.findall(r'£\d+(?:\.\d+)?', content)
        inconsistent_formats = []
        
        for price in price_formats:
            if '.' in price:
                decimal_places = len(price.split('.')[1])
                if decimal_places != 2:
                    inconsistent_formats.append(price)
        
        if inconsistent_formats:
            warnings.append({
                'type': 'inconsistent_price_format',
                'message': f'Inconsistent price formatting: {", ".join(inconsistent_formats[:3])}',
                'severity': 'warning',
                'suggestion': 'Use consistent 2 decimal places: £75.00'
            })
    
    # Check for course name consistency
    course_name_variations = {
        'EFAW': ['emergency first aid', 'efaw', 'emergency fa'],
        'FAW': ['first aid at work', 'faw', 'first aid work'],
        'PAEDIATRIC': ['paediatric', 'pediatric', 'child first aid', 'baby first aid'],
    }
    
    for course_code, variations in course_name_variations.items():
        for variation in variations:
            if variation in content.lower():
                # Check if full correct name is used nearby
                correct_name = COURSE_PRICING[course_code]['name']
                if correct_name.lower() not in content.lower():
                    warnings.append({
                        'type': 'inconsistent_course_name',
                        'message': f'Use full course name: {correct_name}',
                        'severity': 'info'
                    })
                break
    
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
        
        issues, warnings = check_pricing_consistency(content, file_path)
        
        if issues or warnings:
            print(f"💰 PRICING & DURATION CHECK for {file_path}:")
            
            if issues:
                print("\n❌ Errors:")
                for issue in issues:
                    print(f"  • {issue['message']}")
                    if 'suggestion' in issue:
                        print(f"    → {issue['suggestion']}")
            
            if warnings:
                print("\n⚠️  Warnings:")
                for warning in warnings[:5]:
                    msg = f"  • {warning['message']}"
                    if 'suggestion' in warning:
                        print(f"    → {warning['suggestion']}")
            
            print("\n📋 Business Rules:")
            print("  • EFAW: £75, 6 hours (1 day)")
            print("  • Course durations: 6, 12, or 18 hours")
            print("  • Always clarify VAT inclusion")
            print("  • Use config for all prices")
            print("  • Format prices as £XX.00")
        
        sys.exit(0)
        
    except Exception as e:
        print(f"❌ Pricing validation error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()