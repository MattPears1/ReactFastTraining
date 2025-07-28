#!/bin/bash
# Booking Capacity Validator for React Fast Training
# Ensures booking logic respects capacity limits and business rules

PROJECT_DIR="$CLAUDE_PROJECT_DIR"
FILES="$CLAUDE_FILE_PATHS"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$PROJECT_DIR"

# Business rules
MIN_CAPACITY=4
MAX_CAPACITY=20
MIN_BOOKING_NOTICE_HOURS=24
MAX_ADVANCE_BOOKING_DAYS=90

check_booking_files() {
    local file="$1"
    local issues_found=false
    
    echo -e "${YELLOW}📅 Checking booking capacity logic in $(basename $file)...${NC}"
    
    # Check for hardcoded capacity values that should use config
    if grep -E "(capacity|maxAttendees|maxCapacity)\s*[:=]\s*[0-9]+" "$file" | grep -v "MIN_CAPACITY\|MAX_CAPACITY\|config\|import" > /dev/null; then
        echo -e "${RED}❌ Hardcoded capacity values found:${NC}"
        grep -n -E "(capacity|maxAttendees|maxCapacity)\s*[:=]\s*[0-9]+" "$file" | head -5
        echo -e "${YELLOW}   → Use configuration values instead${NC}"
        issues_found=true
    fi
    
    # Check for booking logic without capacity validation
    if grep -E "(createBooking|bookSession|makeReservation)" "$file" > /dev/null; then
        # Check if there's capacity checking nearby
        if ! grep -B5 -A5 -E "(createBooking|bookSession|makeReservation)" "$file" | grep -E "(capacity|availableSlots|remainingSeats)" > /dev/null; then
            echo -e "${RED}❌ Booking operation without capacity check detected${NC}"
            grep -n -E "(createBooking|bookSession|makeReservation)" "$file" | head -3
            issues_found=true
        fi
    fi
    
    # Check for overbooking scenarios
    if grep -E "(spots|seats|attendees)\s*>\s*(capacity|maxCapacity)" "$file" > /dev/null; then
        echo -e "${GREEN}✅ Good: Overbooking prevention logic found${NC}"
    elif grep -E "(addAttendee|registerParticipant|bookSlot)" "$file" > /dev/null; then
        if ! grep -B10 -A10 -E "(addAttendee|registerParticipant|bookSlot)" "$file" | grep -E "(capacity|available|remaining)" > /dev/null; then
            echo -e "${YELLOW}⚠️  Missing capacity check before adding attendee${NC}"
            grep -n -E "(addAttendee|registerParticipant|bookSlot)" "$file" | head -3
        fi
    fi
    
    # Check for minimum attendee validation
    if grep -E "(minimumAttendees|minCapacity|minParticipants)" "$file" > /dev/null; then
        echo -e "${GREEN}✅ Good: Minimum attendee validation found${NC}"
    elif grep -E "(schedule|session|course).*create" "$file" > /dev/null; then
        echo -e "${YELLOW}💡 Consider adding minimum attendee requirements${NC}"
    fi
    
    # Check for advance booking limits
    if grep -E "(bookingDate|sessionDate|courseDate)" "$file" > /dev/null; then
        if ! grep -B10 -A10 -E "(bookingDate|sessionDate|courseDate)" "$file" | grep -E "(advance|future|ahead|notice)" > /dev/null; then
            echo -e "${YELLOW}⚠️  Missing advance booking time validation${NC}"
            echo -e "   → Should enforce ${MIN_BOOKING_NOTICE_HOURS}h min notice, ${MAX_ADVANCE_BOOKING_DAYS} days max advance${NC}"
        fi
    fi
    
    # Check for proper error messages
    if grep -E "(capacity.*reached|fully.*booked|no.*slots)" "$file" > /dev/null; then
        echo -e "${GREEN}✅ Good: Capacity error messages found${NC}"
    fi
    
    # Check for waitlist logic
    if grep -E "(waitlist|waiting.*list|standby)" "$file" > /dev/null; then
        echo -e "${GREEN}✅ Good: Waitlist functionality detected${NC}"
    fi
    
    # Venue capacity validation
    if grep -E "(venue|location|room)" "$file" > /dev/null && grep -E "(booking|session)" "$file" > /dev/null; then
        if ! grep -E "(venue.*capacity|location.*limit|room.*size)" "$file" > /dev/null; then
            echo -e "${YELLOW}💡 Consider validating against venue capacity${NC}"
        fi
    fi
    
    return $([ "$issues_found" = true ] && echo 1 || echo 0)
}

check_database_constraints() {
    local file="$1"
    
    # For migration files, check for proper constraints
    if [[ $file == *"migration"* ]] || [[ $file == *"schema"* ]]; then
        echo -e "${YELLOW}🗄️  Checking database constraints...${NC}"
        
        # Check for capacity constraints
        if grep -E "(sessions|courses|bookings)" "$file" > /dev/null; then
            if ! grep -E "(CHECK.*capacity|CONSTRAINT.*capacity)" "$file" > /dev/null; then
                echo -e "${YELLOW}⚠️  Consider adding database-level capacity constraints${NC}"
            fi
        fi
        
        # Check for booking date constraints
        if grep -E "(booking.*date|session.*date)" "$file" > /dev/null; then
            if ! grep -E "(CHECK.*date|CONSTRAINT.*future)" "$file" > /dev/null; then
                echo -e "${YELLOW}⚠️  Consider adding date validation constraints${NC}"
            fi
        fi
    fi
}

# Main execution
ISSUES_FOUND=false

for file in $FILES; do
    # Check booking-related files
    if [[ $file =~ (booking|session|course|schedule|capacity|attendee).*\.(ts|tsx|js|jsx)$ ]]; then
        check_booking_files "$file"
        if [ $? -eq 1 ]; then
            ISSUES_FOUND=true
        fi
    fi
    
    # Check database files
    if [[ $file =~ \.(sql|migration\.ts|schema\.ts)$ ]]; then
        check_database_constraints "$file"
    fi
    
    # Check API endpoints
    if [[ $file =~ (controller|route|api).*\.(ts|js)$ ]] && grep -E "(booking|session)" "$file" > /dev/null; then
        echo -e "${YELLOW}🔌 Checking API endpoint validation...${NC}"
        
        if ! grep -E "(validateCapacity|checkAvailability|verifySlots)" "$file" > /dev/null; then
            echo -e "${YELLOW}⚠️  API endpoint might need capacity validation${NC}"
        fi
    fi
done

# Summary
echo -e "\n${YELLOW}📊 Booking Capacity Validation Summary:${NC}"
echo -e "Business Rules Enforced:"
echo -e "  • Min capacity: ${MIN_CAPACITY} attendees"
echo -e "  • Max capacity: ${MAX_CAPACITY} attendees"
echo -e "  • Min booking notice: ${MIN_BOOKING_NOTICE_HOURS} hours"
echo -e "  • Max advance booking: ${MAX_ADVANCE_BOOKING_DAYS} days"

if [ "$ISSUES_FOUND" = true ]; then
    echo -e "\n${RED}❌ Capacity validation issues found - please review${NC}"
    exit 0  # Don't block, just warn
else
    echo -e "\n${GREEN}✅ Booking capacity validation passed${NC}"
fi