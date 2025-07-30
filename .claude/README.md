# Claude Code Hooks Configuration - Enhanced Edition

This directory contains the enhanced Claude Code hooks configuration for the React Fast Training project, migrated from JSON to TOML format with significant improvements.

## What are Claude Code Hooks?

Claude Code Hooks are shell commands that automatically execute at specific points in Claude's workflow. They provide deterministic control over:
- **Security**: Block modifications to sensitive files and detect credentials
- **Quality**: Auto-format, lint, and validate code
- **Testing**: Run tests automatically for modified files
- **Workflow**: Track changes, suggest commits, and monitor performance
- **Dependencies**: Check for vulnerabilities and outdated packages

## Configuration Files

### `settings.toml` (Primary)
The main configuration using TOML format (recommended by Claude Code docs). Features:
- Cleaner syntax with better readability
- Enhanced matching patterns
- Comprehensive error handling
- Improved timeout management

### `settings.json` (Legacy)
Original JSON configuration kept for reference. Superseded by `settings.toml`.

## Configured Hooks

### 1. Security Hooks (PreToolUse)
- **security-check.py**: Enhanced security validation
  - Expanded pattern detection (Stripe, SendGrid, cloud services)
  - Whitelist filtering to reduce false positives
  - Detailed issue reporting with matched text
  - Blocks modifications to protected files
  - Path traversal prevention

### 2. Code Quality Hooks (PostToolUse)
- **Prettier**: Auto-formats JS/TS/JSX/TSX files
- **ESLint**: Validation with auto-fix capabilities
- **lint-check.sh**: Comprehensive quality validation
  - TypeScript type checking
  - Unused import detection
  - Tailwind CSS duplicate class detection
  - React accessibility validation
  - Performance issue detection
- **test-runner.sh**: Intelligent test execution
  - Enhanced test file detection
  - Colored output for better visibility
  - Support for backend tests
  - Parallel test execution

### 3. Dependency Management
- **dependency-check.sh**: Security and version management
  - npm audit vulnerability scanning
  - Outdated package detection
  - Duplicate dependency identification
  - Unused dependency analysis

### 4. Workflow Hooks
- **Activity Logging**: Tracks all prompts with timestamps
- **Git Status**: Enhanced change tracking with file counts
- **Commit Suggestions**: Smart notifications for large changes
- **Session Summary**: Detailed statistics on session end
- **Resource Monitoring**: Memory and load tracking

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