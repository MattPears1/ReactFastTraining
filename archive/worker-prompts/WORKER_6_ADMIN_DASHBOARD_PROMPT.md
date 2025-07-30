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

**Folder**: `06-admin-dashboard`

You are building the complete administrative control center for React Fast Training - the powerful backend interface where business operations are managed. Navigate to the "06-admin-dashboard" folder where you'll find at least 2 markdown files (possibly more) defining all administrative features.

**YOUR IMPLEMENTATION APPROACH:**

1. **First, count and catalog all markdown files** in the admin dashboard folder
2. **Use --ultrathink to architect** the entire admin system before writing code
3. **Read ALL markdown files thoroughly** to understand interdependencies
4. **Work through files numerically** implementing each feature completely

**ADMIN DASHBOARD CRITICAL REQUIREMENTS:**

This is the business control center. Your implementation must be:
- **Extremely Secure** - Admin-only access, audit trails, permission checks
- **Data-Rich** - Comprehensive views of all business metrics
- **Action-Oriented** - Quick access to manage courses, bookings, users
- **Reliable** - Error handling for all operations, data integrity
- **Professional** - Clean, efficient interface for daily business use

**Core Admin Features to Implement:**
- Business metrics dashboard with KPIs
- Course session management and scheduling
- Booking oversight and management
- User/customer management
- Financial reports and reconciliation
- Special requirements tracking
- Any additional features specified in the markdown files

**Security & Authorization Requirements:**
1. **Role-based access control** - Different admin levels if specified
2. **Audit logging** - Track all admin actions with timestamps
3. **Session security** - Timeout inactive sessions, force re-auth for sensitive actions
4. **Data protection** - Never expose sensitive customer data unnecessarily
5. **Secure operations** - Confirmation dialogs for destructive actions

**Integration Dependencies:**
- Worker 1's authentication system for admin verification
- Worker 2's course management for session control
- Worker 3's booking system for reservation management
- Worker 4's payment system for financial oversight
- Worker 5's client portal data for customer insights

**Admin UX Principles:**
- **Information density** - Show lots of data efficiently
- **Quick actions** - Common tasks accessible in 1-2 clicks
- **Bulk operations** - Handle multiple items at once
- **Export capabilities** - Data should be exportable for reports
- **Real-time updates** - Show live data where possible
- **Mobile consideration** - Basic functionality on tablets

**Technical Implementation Standards:**
- Implement proper state management for complex data
- Use data tables with sorting, filtering, pagination
- Create a consistent admin layout/navigation system
- Build reusable admin components (tables, forms, etc.)
- Implement comprehensive error boundaries
- Add loading states for all async operations

**Dashboard Performance Requirements:**
- Initial load under 3 seconds
- Efficient data queries (avoid N+1 problems)
- Implement data caching where appropriate
- Lazy load sections as needed
- Optimize for daily business use patterns

**Testing Checklist:**
- Test all CRUD operations thoroughly
- Verify permission checks work correctly
- Test with large datasets for performance
- Ensure all exports work properly
- Test on tablet devices for basic mobile use
- Verify audit trails capture all actions

Remember: This admin dashboard runs the entire business. It needs to be rock-solid, secure, and efficient. The business owner will use this every day to manage operations, so reliability and usability are paramount. Take extra care with data integrity and make sure every feature is thoroughly tested before marking complete.