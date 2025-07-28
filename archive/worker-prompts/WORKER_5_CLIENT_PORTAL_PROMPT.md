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

**Folder**: `05-client-portal`

You are implementing the complete client portal for React Fast Training - the user-facing dashboard where customers manage their training journey. Navigate to the "05-client-portal" folder where you'll find markdown files defining all the features needed for a comprehensive customer experience.

**YOUR IMPLEMENTATION APPROACH:**

1. **First, count and list all markdown files** in the folder - there may be several covering different aspects of the portal
2. **Use --ultrathink extensively** to plan the entire portal architecture before coding
3. **Read EVERY markdown file** to understand the full scope and how features interconnect
4. **Implement systematically** starting with the lowest numbered file and working upward

**CLIENT PORTAL REQUIREMENTS:**

This is the primary interface for customers after login. Your implementation must be:
- **User-Centric** - Intuitive navigation, clear information hierarchy
- **Fully Responsive** - Perfect experience on mobile, tablet, and desktop
- **Performance Optimized** - Fast loading, efficient data fetching
- **Accessible** - WCAG 2.1 AA compliant for all components
- **Secure** - Proper authorization checks, data privacy

**Expected Portal Features (based on typical client portals):**
- Dashboard with upcoming courses and booking status
- Booking history with ability to view details
- Certificate downloads for completed courses
- Account management and profile updates
- Quick rebooking for repeat customers
- Any additional features specified in the markdown files

**Key Integration Points:**
- Worker 1's authentication system controls access
- Worker 2's course data displays available trainings
- Worker 3's booking system shows user's bookings
- Worker 4's payment system provides invoice access

**User Experience Standards:**
1. **Clear Information Architecture** - Users find what they need in 3 clicks or less
2. **Loading States** - Never show blank screens, always indicate progress
3. **Error Handling** - Friendly messages, clear next steps
4. **Empty States** - Helpful content when no data exists
5. **Success Feedback** - Clear confirmation of all actions

**Technical Implementation Guidelines:**
- Use React Context or similar for portal-wide state
- Implement proper data caching to minimize API calls
- Create reusable components for common patterns
- Ensure all data is properly typed with TypeScript
- Test on real devices, not just browser DevTools

**Testing Requirements:**
- Test all user journeys from login to task completion
- Verify responsive design on multiple screen sizes
- Test with slow network connections
- Ensure accessibility with screen readers
- Test error scenarios and edge cases

Remember: This portal is where customers will spend most of their time on the platform. It needs to be polished, professional, and a pleasure to use. Every interaction should reinforce the quality and professionalism of React Fast Training. Take time to get the UX details right - this directly impacts customer satisfaction and retention.