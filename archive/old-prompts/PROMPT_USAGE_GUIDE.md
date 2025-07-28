# Multi-Developer Prompt Usage Guide

## How to Deploy Multiple Developers

### Step 1: Prepare Task Planning Folder Structure
Ensure your folder structure looks like:
```
Task Planning/
├── 1-authentication/
│   ├── 1-user-registration.md
│   ├── 2-login-system.md
│   ├── 3-password-reset.md
│   ├── 4-session-management.md
│   ├── 5-google-oauth.md
│   └── 6-admin-auth.md
├── 2-course-management/
│   ├── 1-course-creation.md
│   ├── 2-scheduling-system.md
│   └── [more files...]
├── 3-booking-system/
│   └── [booking-related.md files]
├── 4-certificate-system/
│   └── [certificate-related.md files]
└── 5-admin-dashboard/
    └── [admin-related.md files]
```

### Step 2: Assign Developers

For each developer:

1. **Copy the universal prompt** from `UNIVERSAL_DEVELOPER_PROMPT.md`
2. **Select the appropriate 200-word prompt** from `DEVELOPER_TASK_PROMPTS.md`
3. **Combine them** by replacing `[INSERT 200-WORD TASK-SPECIFIC PROMPT HERE]` with the specific assignment

### Step 3: Developer Instructions

Give each developer:
```
1. The combined prompt (universal + specific)
2. Access to the codebase
3. Their folder number/name
4. Expected timeline
5. Communication channel for blockers
```

### Step 4: Monitoring Progress

Developers will update completion percentages in each markdown file:
```markdown
## Implementation Status: 75% Complete

### Completed:
- [x] Basic authentication flow
- [x] Password hashing
- [x] Session management

### Remaining:
- [ ] Email verification
- [ ] Rate limiting
```

### Concurrent Development Tips

1. **Stagger start times** by 10-15 minutes to avoid initial conflicts
2. **Use different branches** initially if heavy conflicts expected
3. **Set up a simple communication channel** for "I'm working on X file"
4. **Regular sync meetings** to discuss integration points
5. **One developer as "integration lead"** to merge branches

### Managing Conflicts

When developers report file conflicts:
1. Check who's assigned to that area
2. Determine if it's a true overlap or integration point
3. Coordinate timing or have them work on different files
4. Use git branches if necessary

### Example Combined Prompt for Developer 1:

```
[Full content of UNIVERSAL_DEVELOPER_PROMPT.md]

## Your Specific Assignment

**Folder**: `1-authentication`

Your assignment is to implement the complete authentication system for React Fast Training. Navigate to the "1-authentication" folder where you'll find 6 markdown files detailing login, registration, password reset, session management, OAuth integration (Google only - NO Facebook), and admin authentication.

[Rest of the 200-word authentication prompt...]
```

### Success Metrics

- Each folder's tasks 100% complete
- All TypeScript errors resolved
- Integration tests passing
- Features working end-to-end
- Documentation updated

This approach allows parallel development while maintaining code quality and avoiding major conflicts.