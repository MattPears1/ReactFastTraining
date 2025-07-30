# Schedule Management Test Suite

This directory contains comprehensive tests for the React Fast Training admin schedule management system.

## 🚀 Quick Start

### Prerequisites
1. Ensure the backend server is running: `npm run start`
2. Ensure the email worker is running (optional): `npm run email:worker`
3. Ensure PostgreSQL database is accessible

### Run All Tests
```bash
# From project root
node backend-loopback4/src/test/run-all-tests.js

# Or make it executable
chmod +x backend-loopback4/src/test/run-all-tests.js
./backend-loopback4/src/test/run-all-tests.js
```

## 📋 Individual Test Scripts

### 1. Setup Test Data (`setup-test-data.js`)
Creates necessary test data including:
- Test admin user: `test.admin@reactfasttraining.co.uk` (password: `test123`)
- 5 test customers
- 3 test sessions with varying booking levels
- Test bookings

```bash
node backend-loopback4/src/test/setup-test-data.js
```

### 2. Email Configuration Test (`test-email.js`)
Tests the email service configuration:
- Verifies SMTP settings
- Sends a test email to admin
- Checks email queue processing

```bash
node backend-loopback4/src/test/test-email.js
```

### 3. Session Management Test (`test-session-management.js`)
Tests CRUD operations for sessions:
- Create new session
- Get session details
- Update session
- List all sessions
- Delete session (with validation)

```bash
node backend-loopback4/src/test/test-session-management.js
```

### 4. Email Notifications Test (`test-email-notifications.js`)
Tests all email notification features:
- Email templates
- Reminder emails (24-hour)
- Custom emails to attendees
- Email queue processing

```bash
node backend-loopback4/src/test/test-email-notifications.js
```

### 5. Cancellation Workflow Test (`test-cancellation-workflow.js`)
Tests the complete cancellation workflow:
- Cancel session with reason
- Automatic email notifications
- Refund processing (test mode)
- Activity logging
- Database integrity

```bash
node backend-loopback4/src/test/test-cancellation-workflow.js
```

## 🔧 Configuration

### Environment Variables
Tests use the same `.env` file as the application. Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SMTP_*`: Email configuration
- `STRIPE_SECRET_KEY`: Stripe API key (test mode)

### Test Data Cleanup
Tests create data that may need cleanup:
- Test users (email: `test.*@*`)
- Test sessions (future dates)
- Test bookings
- Email queue entries

To clean up test data:
```sql
-- Remove test users and related data
DELETE FROM users WHERE email LIKE 'test.%';

-- Remove test email queue entries
DELETE FROM email_queue WHERE to_email LIKE 'test.%';
```

## 📊 Expected Results

### Successful Test Run
- All tests should pass with exit code 0
- Email configuration should be valid
- Sessions should be created/updated/deleted
- Emails should be queued (actual sending depends on SMTP config)
- Cancellation should update all related records

### Common Issues
1. **Authentication Failed**: Run setup-test-data.js first
2. **Email Configuration Failed**: Check SMTP settings in .env
3. **Database Connection Failed**: Verify DATABASE_URL
4. **Session Not Found**: Ensure test data exists
5. **Refund Failed**: Normal in test mode without valid Stripe data

## 🧪 Testing Tips

1. **Run tests in order**: Some tests depend on data from previous tests
2. **Check email queue**: 
   ```sql
   SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 10;
   ```
3. **Check refund logs**:
   ```sql
   SELECT * FROM refund_logs ORDER BY created_at DESC LIMIT 10;
   ```
4. **Monitor activity logs**:
   ```sql
   SELECT * FROM activity_logs WHERE created_at > NOW() - INTERVAL '1 hour';
   ```

## 🔍 Debugging

Enable detailed logging:
```bash
DEBUG=* node backend-loopback4/src/test/test-cancellation-workflow.js
```

Check server logs while running tests to see API responses.

## ✅ Test Coverage

The test suite covers:
- ✅ Session CRUD operations
- ✅ Calendar click functionality
- ✅ Email notifications (reminders, custom, cancellations)
- ✅ Cancellation workflow
- ✅ Refund processing (mocked)
- ✅ Database integrity
- ✅ Activity logging
- ✅ Error handling

## 🚦 CI/CD Integration

Add to your CI pipeline:
```yaml
test:
  script:
    - npm install
    - npm run start &
    - sleep 5
    - node backend-loopback4/src/test/run-all-tests.js
```