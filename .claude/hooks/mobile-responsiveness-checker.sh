#!/bin/bash
# Mobile Responsiveness Checker for React Fast Training
# Ensures mobile-first design and proper responsive patterns

PROJECT_DIR="$CLAUDE_PROJECT_DIR"
FILES="$CLAUDE_FILE_PATHS"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$PROJECT_DIR"

check_mobile_patterns() {
    local file="$1"
    local issues_found=false
    
    echo -e "${YELLOW}📱 Checking mobile responsiveness in $(basename $file)...${NC}"
    
    # Check for fixed widths that break mobile
    if grep -E "(width|minWidth):\s*['\"]?[4-9][0-9]{2,}px" "$file" > /dev/null; then
        echo -e "${RED}❌ Fixed width over 400px detected (breaks mobile):${NC}"
        grep -n -E "(width|minWidth):\s*['\"]?[4-9][0-9]{2,}px" "$file" | head -3
        echo -e "${YELLOW}   → Use responsive units (%, vw) or max-width instead${NC}"
        issues_found=true
    fi
    
    # Check for fixed heights that might cause issues
    if grep -E "(height|minHeight):\s*['\"]?[6-9][0-9]{2,}px" "$file" > /dev/null; then
        echo -e "${YELLOW}⚠️  Large fixed height detected:${NC}"
        grep -n -E "(height|minHeight):\s*['\"]?[6-9][0-9]{2,}px" "$file" | head -3
        echo -e "${YELLOW}   → Consider min-height or responsive approach${NC}"
    fi
    
    # Check for proper viewport meta (in HTML files)
    if [[ $file == *".html" ]]; then
        if ! grep -E "viewport.*width=device-width" "$file" > /dev/null; then
            echo -e "${RED}❌ Missing proper viewport meta tag${NC}"
            issues_found=true
        fi
    fi
    
    # Check for touch target sizes (buttons, links)
    if grep -E "<(button|a|input)" "$file" > /dev/null; then
        # Look for size classes or inline styles
        button_matches=$(grep -E "<(button|a)[^>]*>" "$file")
        
        # Check if buttons have appropriate sizing
        if echo "$button_matches" | grep -E "className|class" > /dev/null; then
            if ! echo "$button_matches" | grep -E "(p-[3-9]|py-[3-9]|h-[1-9][0-9]|h-[4-9])" > /dev/null; then
                echo -e "${YELLOW}⚠️  Buttons may not meet 44x44px touch target size${NC}"
                echo -e "   → Add padding: p-3 or py-3 minimum${NC}"
            fi
        fi
    fi
    
    # Check for horizontal scrolling issues
    if grep -E "(overflow-x:\s*scroll|overflowX:\s*['\"]scroll)" "$file" > /dev/null; then
        echo -e "${YELLOW}⚠️  Horizontal scroll detected - avoid on mobile${NC}"
        grep -n -E "(overflow-x:\s*scroll|overflowX:\s*['\"]scroll)" "$file" | head -2
    fi
    
    # Check for mobile-first approach (desktop styles should be in larger breakpoints)
    if grep -E "className|class" "$file" > /dev/null; then
        # Count responsive modifiers
        mobile_first_count=$(grep -o -E "(sm:|md:|lg:|xl:|2xl:)" "$file" | wc -l)
        desktop_first_count=$(grep -o -E "(max-sm:|max-md:|max-lg:)" "$file" | wc -l)
        
        if [ $desktop_first_count -gt $mobile_first_count ]; then
            echo -e "${YELLOW}⚠️  Using desktop-first approach (max-* classes)${NC}"
            echo -e "   → Prefer mobile-first with sm:, md:, lg: modifiers${NC}"
        fi
    fi
    
    # Check for text readability on mobile
    if grep -E "(text-xs|text-\[1[0-3]px\])" "$file" > /dev/null; then
        echo -e "${YELLOW}⚠️  Very small text size detected (< 14px)${NC}"
        grep -n -E "(text-xs|text-\[1[0-3]px\])" "$file" | head -3
        echo -e "   → Minimum 16px recommended for mobile readability${NC}"
    fi
    
    # Check for proper form input sizing on mobile
    if grep -E "<input|<textarea|<select" "$file" > /dev/null; then
        if ! grep -B2 -A2 -E "<input|<textarea|<select" "$file" | grep -E "(text-base|text-lg|h-[1-9][0-9]|py-[2-9])" > /dev/null; then
            echo -e "${YELLOW}⚠️  Form inputs may be too small for mobile${NC}"
            echo -e "   → Use text-base (16px) to prevent zoom on iOS${NC}"
        fi
    fi
    
    # Check for flex/grid responsive patterns
    if grep -E "(flex|grid)" "$file" > /dev/null; then
        # Check if using responsive flex directions
        if grep -E "flex-row" "$file" > /dev/null; then
            if ! grep -E "(flex-col.*sm:flex-row|md:flex-row)" "$file" > /dev/null; then
                echo -e "${YELLOW}💡 Consider responsive flex direction${NC}"
                echo -e "   → flex-col on mobile, sm:flex-row on larger screens${NC}"
            fi
        fi
        
        # Check grid columns
        if grep -E "grid-cols-[3-9]" "$file" > /dev/null; then
            if ! grep -E "(grid-cols-1.*sm:grid-cols-|md:grid-cols-)" "$file" > /dev/null; then
                echo -e "${YELLOW}💡 Multi-column grid without mobile override${NC}"
                echo -e "   → Use grid-cols-1 md:grid-cols-3 pattern${NC}"
            fi
        fi
    fi
    
    # Check for hidden elements on mobile
    if grep -E "(hidden|display:\s*none)" "$file" > /dev/null; then
        if grep -E "(hidden sm:block|hidden md:block)" "$file" > /dev/null; then
            echo -e "${YELLOW}⚠️  Content hidden on mobile${NC}"
            echo -e "   → Ensure critical content is visible on all devices${NC}"
        fi
    fi
    
    # Check image responsiveness
    if grep -E "<img" "$file" > /dev/null; then
        img_tags=$(grep -E "<img[^>]*>" "$file")
        if ! echo "$img_tags" | grep -E "(w-full|max-w-full|object-)" > /dev/null; then
            echo -e "${YELLOW}⚠️  Images may not be responsive${NC}"
            echo -e "   → Add w-full or max-w-full class${NC}"
        fi
    fi
    
    return $([ "$issues_found" = true ] && echo 1 || echo 0)
}

# Main execution
CRITICAL_ISSUES=0

for file in $FILES; do
    # Check React component files
    if [[ $file =~ \.(tsx|jsx)$ ]]; then
        check_mobile_patterns "$file"
        if [ $? -eq 1 ]; then
            ((CRITICAL_ISSUES++))
        fi
        echo ""
    fi
    
    # Check CSS files for responsive issues
    if [[ $file =~ \.(css|scss)$ ]]; then
        echo -e "${YELLOW}🎨 Checking CSS for mobile issues...${NC}"
        
        # Check for desktop-only media queries
        if grep -E "@media.*min-width.*1024px" "$file" > /dev/null; then
            if ! grep -E "@media.*max-width.*768px" "$file" > /dev/null; then
                echo -e "${YELLOW}⚠️  Desktop-only styles without mobile overrides${NC}"
            fi
        fi
    fi
done

# Summary
echo -e "${YELLOW}📊 Mobile Responsiveness Summary:${NC}"
echo -e "Key Requirements:"
echo -e "  • Mobile-first approach (base styles for mobile)"
echo -e "  • Touch targets: minimum 44x44px"
echo -e "  • Text size: minimum 16px for readability"
echo -e "  • Flexible layouts: use relative units"
echo -e "  • Test on real devices: 320px - 768px widths"

if [ $CRITICAL_ISSUES -gt 0 ]; then
    echo -e "\n${RED}❌ Found $CRITICAL_ISSUES critical mobile issues${NC}"
else
    echo -e "\n${GREEN}✅ Mobile responsiveness check passed${NC}"
fi