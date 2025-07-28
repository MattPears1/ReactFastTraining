#!/usr/bin/env python3
"""
Design System Enforcer for React Fast Training
Ensures consistent use of design tokens and brand guidelines
"""

import json
import sys
import re
import os

# Design system colors from the project
DESIGN_TOKENS = {
    'colors': {
        # Primary - Trust Blue
        'primary-500': '#0EA5E9',
        'primary-600': '#0284C7',
        'primary-700': '#0369A1',
        # Secondary - Healing Green  
        'secondary-500': '#10B981',
        # Accent - Energy Orange
        'accent-500': '#F97316',
        # Grays
        'gray-50': '#F9FAFB',
        'gray-100': '#F3F4F6',
        'gray-200': '#E5E7EB',
        'gray-300': '#D1D5DB',
        'gray-400': '#9CA3AF',
        'gray-500': '#6B7280',
        'gray-600': '#4B5563',
        'gray-700': '#374151',
        'gray-800': '#1F2937',
        'gray-900': '#111827',
    },
    'spacing': {
        '0': '0',
        '1': '0.25rem',  # 4px
        '2': '0.5rem',   # 8px
        '3': '0.75rem',  # 12px
        '4': '1rem',     # 16px
        '5': '1.25rem',  # 20px
        '6': '1.5rem',   # 24px
        '8': '2rem',     # 32px
        '10': '2.5rem',  # 40px
        '12': '3rem',    # 48px
        '16': '4rem',    # 64px
    },
    'fonts': {
        'heading': 'Outfit',
        'body': 'Inter',
    },
    'breakpoints': {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
    }
}

# Patterns to detect hardcoded values
HARDCODED_PATTERNS = {
    'colors': [
        r'color:\s*["\']?#[0-9a-fA-F]{3,6}',
        r'backgroundColor:\s*["\']?#[0-9a-fA-F]{3,6}',
        r'borderColor:\s*["\']?#[0-9a-fA-F]{3,6}',
        r'rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)',
        r'rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,',
        # Tailwind arbitrary values
        r'(?:text|bg|border)-\[#[0-9a-fA-F]{3,6}\]',
        r'(?:text|bg|border)-\[rgb',
    ],
    'spacing': [
        r'(?:margin|padding|gap|space):\s*["\']?\d+px',
        r'(?:width|height|minWidth|maxWidth|minHeight|maxHeight):\s*["\']?\d+px',
        r'(?:top|right|bottom|left):\s*["\']?\d+px',
        # Tailwind arbitrary values
        r'(?:m|p|gap|space-[xy]?)-\[\d+px\]',
        r'(?:w|h)-\[\d+px\]',
    ],
    'fonts': [
        r'fontFamily:\s*["\'][^"\']+["\'](?!.*(?:Outfit|Inter))',
        r'font-family:\s*["\'][^"\']+["\'](?!.*(?:Outfit|Inter))',
        # Hardcoded font in Tailwind
        r'font-\[["\'][^"\']+["\']\]',
    ],
    'responsive': [
        r'@media[^{]+\d+px',  # Media queries with pixel values
        r'(?:max-w|min-w)-\[\d+px\]',  # Arbitrary responsive values
    ]
}

# Acceptable exceptions
EXCEPTIONS = {
    'colors': [
        'transparent',
        'currentColor',
        'inherit',
        'white',
        'black',
    ],
    'spacing': [
        '0',
        '100%',
        '100vh',
        '100vw',
        'auto',
        'fit-content',
    ],
    'images': [
        'data:image',  # Base64 images
        '.svg',  # SVG files are ok
    ]
}

def check_design_system_compliance(content, file_path):
    """Check for design system violations"""
    issues = []
    
    # Skip certain file types
    if any(skip in file_path for skip in ['.test.', '.spec.', '.json', '.md']):
        return issues
    
    # Check for hardcoded colors
    for pattern in HARDCODED_PATTERNS['colors']:
        matches = list(re.finditer(pattern, content, re.IGNORECASE))
        for match in matches:
            value = match.group(0)
            # Check if it's an exception
            if not any(exc in value for exc in EXCEPTIONS['colors']):
                line_num = content[:match.start()].count('\n') + 1
                
                # Try to suggest the closest design token
                suggestion = suggest_color_token(value)
                
                issues.append({
                    'type': 'hardcoded_color',
                    'line': line_num,
                    'value': value,
                    'message': f'Hardcoded color detected: {value}',
                    'suggestion': suggestion
                })
    
    # Check for hardcoded spacing
    for pattern in HARDCODED_PATTERNS['spacing']:
        matches = list(re.finditer(pattern, content))
        for match in matches:
            value = match.group(0)
            # Extract pixel value
            px_match = re.search(r'(\d+)px', value)
            if px_match:
                px_value = int(px_match.group(1))
                
                # Check common acceptable values
                if px_value not in [0] and str(px_value) + 'px' not in EXCEPTIONS['spacing']:
                    line_num = content[:match.start()].count('\n') + 1
                    suggestion = suggest_spacing_token(px_value)
                    
                    issues.append({
                        'type': 'hardcoded_spacing',
                        'line': line_num,
                        'value': value,
                        'message': f'Hardcoded spacing detected: {px_value}px',
                        'suggestion': suggestion
                    })
    
    # Check for non-standard fonts
    for pattern in HARDCODED_PATTERNS['fonts']:
        matches = list(re.finditer(pattern, content))
        for match in matches:
            value = match.group(0)
            line_num = content[:match.start()].count('\n') + 1
            
            issues.append({
                'type': 'non_standard_font',
                'line': line_num,
                'value': value,
                'message': 'Non-standard font detected',
                'suggestion': 'Use font-heading (Outfit) or font-body (Inter)'
            })
    
    # Check for responsive breakpoints
    if '@media' in content:
        for pattern in HARDCODED_PATTERNS['responsive']:
            matches = list(re.finditer(pattern, content))
            for match in matches:
                value = match.group(0)
                line_num = content[:match.start()].count('\n') + 1
                
                issues.append({
                    'type': 'hardcoded_breakpoint',
                    'line': line_num,
                    'value': value,
                    'message': 'Hardcoded breakpoint detected',
                    'suggestion': 'Use Tailwind responsive prefixes: sm:, md:, lg:, xl:, 2xl:'
                })
    
    # Check for image optimization
    img_pattern = r'<img[^>]+src=["\']([^"\']+)["\']'
    img_matches = re.finditer(img_pattern, content)
    for match in img_matches:
        img_src = match.group(1)
        if not any(exc in img_src for exc in EXCEPTIONS['images']):
            # Check file size reference (if path looks like it might be large)
            if any(ext in img_src.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                line_num = content[:match.start()].count('\n') + 1
                
                # Check for optimization attributes
                img_tag = match.group(0)
                if 'loading=' not in img_tag:
                    issues.append({
                        'type': 'unoptimized_image',
                        'line': line_num,
                        'value': img_src,
                        'message': 'Image missing lazy loading',
                        'suggestion': 'Add loading="lazy" for better performance'
                    })
    
    return issues

def suggest_color_token(color_value):
    """Suggest the closest design token for a color"""
    # Extract hex from the value
    hex_match = re.search(r'#([0-9a-fA-F]{3,6})', color_value)
    if hex_match:
        hex_color = hex_match.group(0).upper()
        
        # Check if it matches any design token
        for token_name, token_value in DESIGN_TOKENS['colors'].items():
            if token_value.upper() == hex_color:
                if 'tailwind' in color_value.lower() or 'bg-' in color_value or 'text-' in color_value:
                    return f'Use Tailwind class: {token_name.replace("-", "-")}'
                else:
                    return f'Use CSS variable: --color-{token_name}'
    
    return 'Use design system colors: primary-*, secondary-*, accent-*, or gray-*'

def suggest_spacing_token(px_value):
    """Suggest the closest spacing token"""
    # Common pixel to rem conversions (assuming 16px base)
    spacing_map = {
        4: '1',    # 0.25rem
        8: '2',    # 0.5rem
        12: '3',   # 0.75rem
        16: '4',   # 1rem
        20: '5',   # 1.25rem
        24: '6',   # 1.5rem
        32: '8',   # 2rem
        40: '10',  # 2.5rem
        48: '12',  # 3rem
        64: '16',  # 4rem
    }
    
    if px_value in spacing_map:
        return f'Use Tailwind spacing: {spacing_map[px_value]} (e.g., p-{spacing_map[px_value]}, m-{spacing_map[px_value]})'
    
    # Find closest value
    closest = min(spacing_map.keys(), key=lambda x: abs(x - px_value))
    return f'Consider using spacing-{spacing_map[closest]} ({closest}px) instead of {px_value}px'

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
        if not any(ext in file_path for ext in ['.tsx', '.jsx', '.css', '.scss']):
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
        
        issues = check_design_system_compliance(content, file_path)
        
        if issues:
            print(f"🎨 DESIGN SYSTEM ISSUES in {file_path}:")
            
            # Group by type
            by_type = {}
            for issue in issues:
                issue_type = issue['type']
                if issue_type not in by_type:
                    by_type[issue_type] = []
                by_type[issue_type].append(issue)
            
            for issue_type, type_issues in by_type.items():
                print(f"\n  {issue_type.replace('_', ' ').title()}:")
                for issue in type_issues[:3]:  # Limit to 3 per type
                    print(f"    Line {issue['line']}: {issue['message']}")
                    if issue.get('suggestion'):
                        print(f"      → {issue['suggestion']}")
            
            print("\n💡 Design System Guidelines:")
            print("  • Colors: Use Tailwind classes (text-primary-500, bg-secondary-500)")
            print("  • Spacing: Use Tailwind utilities (p-4, m-6, gap-2)")
            print("  • Fonts: Use font-heading (Outfit) or font-body (Inter)")
            print("  • Responsive: Use Tailwind breakpoints (sm:, md:, lg:)")
        
        sys.exit(0)
        
    except Exception as e:
        print(f"❌ Design system check error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()