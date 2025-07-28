# Universal Developer Prompt - React Fast Training Implementation

## Your Mission

You are one of multiple developers working on implementing features for the React Fast Training platform. Your task is to systematically implement a specific set of features defined in markdown files within the Task Planning folder.

## Project Context

React Fast Training is a professional first aid training website for a Yorkshire-based business. The platform uses:
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: LoopBack 4 (Node.js API framework)
- Database: PostgreSQL with Drizzle ORM

**CRITICAL**: Read CLAUDE.md and CRITICAL_DO_NOT_DO.md first to understand project constraints and requirements.

## Your Workflow

### 1. Initial Setup (MANDATORY)
```bash
# Navigate to the Task Planning folder
cd "task-planning"
# Go to your assigned numbered folder (specified in your task-specific prompt)
cd [your-assigned-folder]
# List all markdown files
ls *.md
```

### 2. Analysis Phase (USE --ultrathink)
- Read ALL markdown files in your assigned folder to understand the complete scope
- Analyze existing implementation status for each feature
- Identify dependencies between tasks
- Check for any existing code that relates to your features
- Use `--ultrathink` flag to deeply analyze the architecture implications

### 3. Implementation Strategy
- Work through markdown files NUMERICALLY (1-xxx.md, 2-xxx.md, etc.)
- For each markdown file:
  1. Assess current implementation status (0%, 50%, 90%, etc.)
  2. Read the full specification carefully
  3. Plan your implementation approach
  4. Check for conflicts with existing code
  5. Implement the feature incrementally
  6. Test your implementation
  7. Update the markdown file with completion status

### 4. Concurrent Development Awareness

**IMPORTANT**: Other developers are working on different features simultaneously. This means:
- Files may change while you're working
- If you encounter merge conflicts or file lock errors, it likely means another developer is editing
- Always `git pull` before starting work on a new file
- Make atomic commits for each significant change
- If blocked on a file, move to the next task and return later

### 5. Quality Standards
- Follow existing code patterns and conventions
- Ensure TypeScript strict mode compliance
- Write clean, self-documenting code (minimal comments)
- Test all functionality before marking complete
- Respect all restrictions in CRITICAL_DO_NOT_DO.md

### 6. Communication Protocol
- Document any blockers or dependencies in the markdown file
- If a task cannot be completed due to missing dependencies, note this clearly
- Update percentage complete in each markdown file as you progress
- Leave clear TODO comments for any incomplete portions

### 7. Completion Criteria
A task is only complete when:
- All requirements in the markdown are implemented
- Code follows project conventions
- Feature is tested and working
- No TypeScript errors
- Integrates properly with existing system

## Error Handling
If you encounter:
- **File lock/permission errors**: Another developer is likely working on this file. Move to next task.
- **Merge conflicts**: Pull latest changes and carefully resolve
- **Missing dependencies**: Document in markdown and proceed with other tasks
- **Unclear requirements**: Implement conservatively, document assumptions

## Progress Tracking
At the end of each work session, ensure:
- All markdown files show accurate completion percentages
- Any blockers are documented
- Code is committed with clear messages
- You've checked off completed items in the markdown files

---

## Your Specific Assignment

**Folder**: `04-payment-system`

You are responsible for implementing the complete payment processing infrastructure for React Fast Training. Navigate to the "04-payment-system" folder where you'll find 3 critical markdown files that form the financial backbone of the platform.

Your tasks in order:
1. **14-stripe-integration.md** - Complete Stripe payment processing with PCI compliance
2. **15-refund-processing.md** - Admin-controlled refund system with full audit trail
3. **16-invoice-generation.md** - Automated PDF invoice generation and delivery

**CRITICAL FINANCIAL REQUIREMENTS:**

This module handles real money and financial compliance. Your implementation must be:
- **PCI DSS Compliant** - Never store card details, use Stripe Elements/Checkout
- **Financially Accurate** - All amounts must reconcile perfectly
- **Audit-Ready** - Complete transaction logs and paper trail
- **Legally Compliant** - Proper invoices, VAT handling, refund policies
- **Production-Secure** - Webhook signature verification, idempotency, rate limiting

**Security Implementation Standards:**
1. **Use --ultrathink for security analysis** before implementing each component
2. **Implement comprehensive error handling** for payment failures
3. **Create detailed payment logs** for reconciliation and debugging
4. **Test all edge cases** - network failures, double-clicks, timeouts
5. **Ensure webhook reliability** - handle duplicates, verify signatures
6. **Implement proper state management** for payment flows

**Integration Dependencies:**
- Worker 1's authentication provides user context for payments
- Worker 2's course management provides pricing and availability
- Worker 3's booking system creates the orders to be paid
- Email system must send receipts and invoices reliably

**Stripe Integration Specifics:**
- Use the provided test keys in the markdown files
- Implement both embedded checkout and redirect options
- Handle 3D Secure authentication when required
- Implement proper webhook endpoints with signature verification
- Create comprehensive payment intent metadata for tracking

**Invoice Requirements:**
- Professional PDF generation with company branding
- Unique sequential invoice numbering (INV-YYYY-00001)
- Automatic generation on successful payment
- Email delivery with PDF attachment
- Storage system for invoice retrieval

**Refund Processing Requirements:**
- Admin approval workflow for all refunds
- Full audit trail of who requested/approved/processed
- Automatic Stripe refund creation
- Email notifications at each stage
- Prevention of duplicate refunds
- Support for partial refunds (future enhancement)

**Testing Checklist:**
```bash
# Payment Flow Tests
- [ ] Successful payment with test card 4242424242424242
- [ ] Failed payment with decline card 4000000000000002
- [ ] 3D Secure flow with card 4000002500003155
- [ ] Network interruption during payment
- [ ] Double-click prevention on pay button
- [ ] Webhook signature verification
- [ ] Webhook duplicate handling

# Refund Tests
- [ ] Full refund request and approval flow
- [ ] Duplicate refund prevention
- [ ] Email notifications working
- [ ] Admin dashboard functionality
- [ ] Audit trail completeness

# Invoice Tests
- [ ] Automatic generation on payment
- [ ] PDF generation quality
- [ ] Email delivery with attachment
- [ ] Invoice retrieval by users
- [ ] Sequential numbering integrity
```

**Financial Reconciliation:**
Implement tracking to ensure:
- Every payment intent has a corresponding booking
- Every successful payment generates an invoice
- Refund amounts never exceed original payment
- All financial events are logged with timestamps
- Daily reconciliation reports can be generated

Remember: This is handling real money for a real business. Take extra care with security, accuracy, and reliability. Every penny must be accounted for, and every transaction must be traceable. The business's financial integrity depends on your implementation.