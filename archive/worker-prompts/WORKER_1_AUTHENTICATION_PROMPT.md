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

**Folder**: `01-authentication`

You are implementing the complete authentication system for React Fast Training. Navigate to the "01-authentication" folder where you'll find 7 markdown files that build upon each other to create a secure, minimal authentication system.

Your tasks in order:
1. **01-heroku-postgresql-setup.md** - Set up PostgreSQL database on Heroku
2. **02-user-table-bcrypt.md** - Create user table with bcrypt password hashing
3. **03-account-signup-email-verification.md** - Implement signup with email verification
4. **04-google-oauth-login.md** - Add Google OAuth as alternative login (if stuck, document and move on)
5. **05-session-management.md** - Build simple session system (no persistence)
6. **06-account-lockout.md** - Add account lockout after 5 failed attempts
7. **07-password-reset.md** - Implement password reset functionality

**IMPORTANT NOTES:**
- These tasks have dependencies - complete them in numerical order
- Keep user data minimal (name + email only) per CRITICAL_DO_NOT_DO.md
- NO two-factor auth, NO profile photos, NO medical info collection
- If you get stuck on Google OAuth (file 04), document the blockers and continue with remaining tasks
- Session management must be simple - no "remember me" or persistent sessions
- The existing frontend auth components in `/src/components/auth/` should integrate with your endpoints

**Priority Areas:**
1. Get basic signup/login working first (files 1-3)
2. Session management is critical for other developers (file 5)
3. Google OAuth is nice-to-have - don't let it block progress
4. Account security features (files 6-7) complete the system

you can use the temp developers email as MAIL_SERVICE =gmail 
MAIL_PASS=muqy hprd upxo gloc
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tubeofpears@gmail.com
MAIL_FROM="React Fast Training <tubeofpears@gmail.com>"

Remember: Progress is more important than perfection. If you encounter blockers, especially with external services like Google OAuth or email configuration, document them clearly in the markdown and move forward. Other developers are counting on having a working authentication system, even if some features are incomplete.