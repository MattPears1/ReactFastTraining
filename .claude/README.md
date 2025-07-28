# Claude Code Hooks Configuration

This directory contains custom hooks configuration for Claude Code to enhance security, code quality, and workflow automation for the React Fast Training project.

## What are Claude Code Hooks?

Claude Code Hooks are shell commands that automatically execute at specific points in Claude's workflow. They provide:
- **Security**: Block modifications to sensitive files
- **Quality**: Auto-format and lint code
- **Testing**: Run tests automatically
- **Workflow**: Track changes and suggest commits

## Configured Hooks

### 1. Security Hooks (PreToolUse)
- **security-check.py**: Validates all file modifications
  - Blocks changes to `.env`, credentials, and sensitive files
  - Detects API keys, passwords, and secrets in code
  - Prevents path traversal attacks
  - Checks for database URLs and private keys

### 2. Code Quality Hooks (PostToolUse)
- **Prettier**: Auto-formats JS/TS files after edits
- **ESLint**: Runs linting with auto-fix on modified files
- **Test Runner**: Automatically runs related tests

### 3. Workflow Hooks
- **Activity Logging**: Tracks all prompts in `.claude/activity.log`
- **Git Status**: Shows uncommitted changes after Claude's work
- **Commit Suggestions**: Alerts when 10+ files are modified

## Hook Events

1. **UserPromptSubmit**: When you submit a prompt
2. **PreToolUse**: Before Claude uses any tool (Edit, Write, etc.)
3. **PostToolUse**: After tool execution completes
4. **PostResponse**: After Claude finishes responding

## Usage

The hooks are automatically active when using Claude Code in this project. You can:

1. **View active hooks**: Type `/hooks` in Claude
2. **Test hooks**: Make a change to trigger them
3. **Disable temporarily**: Comment out hooks in `settings.json`

## Security Features

### Blocked Files
- `.env`, `.env.local`, `.env.production`
- `credentials.json`, `serviceAccount.json`
- Any file in `.git/`, `node_modules/`, `dist/`
- Files specified in `CRITICAL_DO_NOT_DO.md`

### Detected Patterns
- API keys and tokens
- Passwords and secrets
- Private keys (RSA, SSH)
- AWS credentials
- Database connection strings

## Customization

### Add a New Hook

1. Create a script in `.claude/hooks/`
2. Make it executable: `chmod +x your-script.sh`
3. Add to `settings.json`:

```json
{
  "comment": "Description of your hook",
  "matcher": "ToolName",
  "hooks": [{
    "type": "command",
    "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/your-script.sh"
  }]
}
```

### Modify Security Rules

Edit `security-check.py` to:
- Add new blocked files/paths
- Add new sensitive patterns
- Customize error messages

## Best Practices

1. **Test hooks locally** before adding to configuration
2. **Use `run_in_background: true`** for non-critical hooks
3. **Keep hooks fast** to avoid slowing down Claude
4. **Use exit codes properly**:
   - 0: Success
   - 2: Critical error (stops Claude)
   - Other: Warning only

## Troubleshooting

### Hook Not Running
- Check file permissions: `ls -la .claude/hooks/`
- Verify path in settings.json
- Use `/hooks` to see loaded configuration

### Hook Blocking Claude
- Exit code 2 stops Claude's action
- Check stderr output for error messages
- Temporarily disable in settings.json

### Performance Issues
- Use `run_in_background: true` for slow operations
- Limit output with `head` or `grep`
- Consider moving to post-response hooks

## Examples

### Custom Lint Rule
```bash
#!/bin/bash
# .claude/hooks/custom-lint.sh
if grep -n "console.log" "$CLAUDE_FILE_PATHS" 2>/dev/null; then
    echo "⚠️  Found console.log statements - consider removing for production"
fi
```

### Auto Documentation
```bash
#!/bin/bash
# .claude/hooks/update-docs.sh
if [[ "$CLAUDE_FILE_PATHS" == *"src/components/"* ]]; then
    echo "📝 Remember to update component documentation"
fi
```

## Security Warning

⚠️ **IMPORTANT**: Hooks execute with your user permissions and can:
- Modify or delete any files
- Access system resources
- Run any commands you can run

Always review hook commands before adding them to your configuration.

---

For more information, see the [official Claude Code hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks).