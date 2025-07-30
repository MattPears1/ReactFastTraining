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

**Folder**: `03-booking-system`

You are implementing the complete booking system for React Fast Training - the heart of the business operations. Navigate to the "03-booking-system" folder where you'll find 3 comprehensive markdown files that together create a production-ready booking experience.

Your tasks in order:
1. **11-multistep-booking-wizard.md** - Sophisticated 4-step booking flow with validation
2. **12-booking-confirmation-emails.md** - Professional email system with PDFs and calendar files  
3. **13-special-requirements-accessibility.md** - Comprehensive accessibility handling system

**CRITICAL IMPLEMENTATION REQUIREMENTS:**

This is the revenue-generating core of the business. Your implementation must be:
- **Production-ready** - No shortcuts, fully polished
- **Thoroughly tested** - Edge cases, error states, race conditions
- **User-friendly** - Smooth flow, clear feedback, mobile-optimized
- **Legally compliant** - Terms acceptance, GDPR, accessibility standards
- **Robust** - Handle payment failures, network issues, concurrent bookings

**Quality Standards for This Module:**
1. **Use --ultrathink extensively** before coding each component
2. **Plan the entire architecture** before starting implementation
3. **Build reusable, maintainable components** - this will be extended
4. **Implement comprehensive error handling** at every step
5. **Create detailed logging** for debugging payment issues
6. **Ensure accessibility** - WCAG 2.1 AA compliance minimum

**Key Integration Points:**
- Worker 1's authentication system provides user context
- Worker 2's course management provides availability APIs
- Stripe integration must be production-ready (use test keys)
- Email system needs proper templates and error handling

**Payment Security Requirements:**
- Never store card details
- Use Stripe's recommended security practices
- Implement 3D Secure when required
- Log all payment attempts for reconciliation

**Testing Requirements:**
- Unit tests for all business logic
- Integration tests for booking flow
- Manual testing on real devices
- Test all error scenarios
- Verify email delivery

Remember: This is where customers pay money. Every detail matters. Take your time, think through edge cases, and build something you'd be proud to put into production. The business depends on this working flawlessly.