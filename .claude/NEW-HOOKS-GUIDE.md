# New Claude Code Hooks for React Fast Training

## Overview

We've implemented 11 new specialized hooks that enforce business rules, security compliance, and code quality standards specific to the React Fast Training project. These hooks run automatically during development to catch issues before they reach production.

## Business Logic Validators

### 1. 🔒 GDPR Compliance Checker (`gdpr-compliance-check.py`)
**Purpose**: Ensures personal data handling follows GDPR requirements

**Triggers on**: Files in booking, auth, contact, and user management components

**Key Features**:
- Detects personal data collection without consent
- Checks for privacy policy links in forms
- Validates data deletion capabilities
- Ensures proper data retention policies
- Warns about third-party data sharing

**Example Issues Caught**:
```typescript
// ❌ Will trigger warning
<input type="email" name="email" />

// ✅ Correct implementation
<input type="email" name="email" />
<input type="checkbox" required name="consent" />
<label>I agree to the <a href="/privacy">privacy policy</a></label>
```

### 2. 📅 Booking Capacity Validator (`booking-capacity-validator.sh`)
**Purpose**: Ensures booking logic respects capacity limits

**Business Rules Enforced**:
- Min capacity: 4 attendees
- Max capacity: 20 attendees
- Min booking notice: 24 hours
- Max advance booking: 90 days

**Key Features**:
- Detects hardcoded capacity values
- Validates capacity checks before booking
- Ensures overbooking prevention
- Checks venue capacity constraints
- Validates advance booking limits

### 3. 📜 Certificate Template Validator (`certificate-template-validator.py`)
**Purpose**: Ensures certificates meet HSE and Ofqual requirements

**Required Certificate Elements**:
- Unique certificate number (Format: RFT-YYYY-XXXXXX)
- 3-year expiry date for first aid certificates
- HSE approval text
- Ofqual regulation text
- Instructor name and signature
- QCF level indication

**Security Features Recommended**:
- QR code for verification
- Watermark
- Verification URL

### 4. 🗄️ Database Migration Validator (`database-migration-validator.sh`)
**Purpose**: Ensures safe and reversible database changes

**Key Validations**:
- Both up() and down() methods required
- Transaction wrapping for multiple operations
- Safeguards for destructive operations
- Proper handling of NOT NULL columns
- Index creation without table locks
- Foreign key constraint rules

## UI/UX Consistency Validators

### 5. 🎨 Design System Enforcer (`design-system-enforcer.py`)
**Purpose**: Ensures consistent use of design tokens

**Design System Rules**:
- **Colors**: Primary (Trust Blue), Secondary (Healing Green), Accent (Energy Orange)
- **Fonts**: Outfit (headings), Inter (body)
- **Spacing**: Use Tailwind classes (p-4, m-6, gap-2)
- **Breakpoints**: sm: 640px, md: 768px, lg: 1024px

**Detects**:
- Hardcoded hex colors instead of design tokens
- Non-standard fonts
- Hardcoded pixel spacing
- Custom breakpoints

### 6. 📱 Mobile Responsiveness Checker (`mobile-responsiveness-checker.sh`)
**Purpose**: Ensures mobile-first design

**Key Checks**:
- Fixed widths over 400px (breaks mobile)
- Touch targets minimum 44x44px
- Text size minimum 16px
- Mobile-first class usage
- Responsive flex/grid patterns
- Image responsiveness

### 7. ⏳ Loading State Validator (`loading-state-validator.py`)
**Purpose**: Ensures proper loading states for async operations

**Validations**:
- Loading state management for async calls
- Error handling for failed requests
- Loading UI components (spinners, skeletons)
- Error UI components
- Loading state reset in finally blocks

### 8. 📋 Form Validation Consistency (`form-validation-consistency.py`)
**Purpose**: Ensures consistent form patterns

**Key Features**:
- Validates use of react-hook-form + zod
- Checks for error message display
- Ensures label associations
- Validates required field indicators (*)
- Checks submission loading states
- Ensures success feedback

## Business Rules Validators

### 9. 💰 Pricing & Course Duration Validator (`pricing-course-validator.py`)
**Purpose**: Ensures pricing and duration consistency

**Business Rules**:
- EFAW: £75, 6 hours
- Valid durations: 6, 12, or 18 hours
- Price format: £XX.00
- VAT clarification required
- Use configuration for all prices

**Detects**:
- Hardcoded prices outside config
- Invalid course durations
- Inconsistent price formatting
- Missing VAT information

### 10. 💳 Payment Security Validator (`payment-security-validator.py`)
**Purpose**: Ensures PCI DSS compliance

**Critical Security Rules**:
- NEVER store card numbers or CVV
- Use payment provider tokenization (Stripe)
- Always use HTTPS for payment pages
- Never log payment details
- Server-side validation required

**Blocks Execution For**:
- Direct card number handling
- Card data in localStorage/cookies
- Non-HTTPS protocols
- Payment data logging

## How to Use

### View Active Hooks
```bash
# In Claude Code
/hooks
```

### Test a Specific Hook
```bash
# Test manually
./claude/hooks/gdpr-compliance-check.py < test-input.json
```

### Disable a Hook Temporarily
Comment out the hook in `settings.toml` or add to the matcher:
```toml
[hooks.matcher]
file_paths = ["!**/test/**", "!**/temp/**"]  # Exclude test and temp directories
```

## Hook Priority & Performance

### PreToolUse (Blocking)
1. Security Check (Original)
2. Database Migration Validator
3. Payment Security Validator

### PostToolUse (Non-blocking)
All other hooks run in background mode to avoid slowing down development.

## Common Issues & Solutions

### "Too many warnings"
- Focus on fixing errors first (red ❌)
- Warnings (yellow ⚠️) are suggestions
- Info (blue ℹ️) are best practices

### "Hook is too strict"
- Adjust patterns in the hook script
- Add exceptions for specific cases
- Use file path exclusions

### "Hook not triggering"
- Check file path patterns in settings.toml
- Verify hook script is executable
- Test with `/hooks` command

## Future Enhancements

Consider adding:
- Automated fix suggestions
- Hook statistics dashboard
- Custom hook templates
- Team-specific rule sets

---

These hooks transform Claude Code into a specialized development environment for React Fast Training, ensuring compliance, quality, and consistency across the entire codebase.