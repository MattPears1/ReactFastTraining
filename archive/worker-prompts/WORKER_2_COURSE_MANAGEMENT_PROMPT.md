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

**Folder**: `02-course-management`

You are implementing the complete course management system for React Fast Training. Navigate to the "02-course-management" folder where you'll find 3 markdown files that work together to create a comprehensive course scheduling and management system.

Your tasks in order:
1. **08-realtime-availability-calendar.md** - Visual calendar with real-time booking updates
2. **09-course-filters-capacity.md** - Filtering system with strict 12-person capacity management
3. **10-course-creation-management.md** - Admin interface for creating and managing courses

**CRITICAL CONSTRAINTS:**
- Maximum 12 attendees per course (hard limit, no exceptions)
- Simple location system (Location A/B only) per CRITICAL_DO_NOT_DO.md
- NO waitlist functionality
- NO drag-and-drop features initially
- Single instructor business - all courses taught by Lex

**Key Integration Points:**
- Calendar must show live availability as bookings are made
- Capacity indicators must prevent overbooking
- Admin tools must enforce all business rules
- WebSocket implementation for real-time updates (if blocked, use polling fallback)

**Implementation Notes:**
- The existing Course and CourseSession models in `/backend-loopback4/src/models/` have been updated to reflect all courses as full-day sessions
- Frontend course display pages exist in `/src/pages/courses/`
- Worker 1 is building authentication, so assume basic auth works
- Worker 3 will need your APIs for the booking system
 