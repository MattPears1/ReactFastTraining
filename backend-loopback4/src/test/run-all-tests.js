#!/usr/bin/env node

require('dotenv').config({ path: __dirname + '/../../.env' });
const { spawn } = require('child_process');
const path = require('path');

const tests = [
  {
    name: 'Setup Test Data',
    script: 'setup-test-data.js',
    description: 'Creates test users, sessions, and bookings'
  },
  {
    name: 'Email Configuration Test',
    script: 'test-email.js',
    description: 'Tests email service configuration'
  },
  {
    name: 'Session Management Test',
    script: 'test-session-management.js',
    description: 'Tests creating, updating, and deleting sessions'
  },
  {
    name: 'Email Notifications Test',
    script: 'test-email-notifications.js',
    description: 'Tests reminder emails and custom notifications'
  },
  {
    name: 'Cancellation Workflow Test',
    script: 'test-cancellation-workflow.js',
    description: 'Tests full cancellation with emails and refunds'
  }
];

let currentTest = 0;
const results = [];

function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Running: ${test.name}`);
    console.log(`📝 ${test.description}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const startTime = Date.now();
    const testPath = path.join(__dirname, test.script);
    const child = spawn('node', [testPath], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const result = {
        name: test.name,
        script: test.script,
        success: code === 0,
        duration: duration + 's',
        exitCode: code
      };
      
      results.push(result);
      
      if (code === 0) {
        console.log(`\n✅ ${test.name} completed successfully in ${duration}s`);
      } else {
        console.log(`\n❌ ${test.name} failed with exit code ${code}`);
      }
      
      resolve();
    });
  });
}

async function runAllTests() {
  console.log('🚀 React Fast Training - Comprehensive Test Suite');
  console.log('================================================\n');
  console.log(`Running ${tests.length} test suites...\n`);
  
  const startTime = Date.now();
  
  // Run tests sequentially
  for (const test of tests) {
    await runTest(test);
    
    // Wait 2 seconds between tests
    if (currentTest < tests.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    currentTest++;
  }
  
  // Display summary
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nTotal Tests: ${tests.length}`);
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`⏱️  Total Duration: ${totalDuration}s`);
  
  console.log('\nDetailed Results:');
  console.log('-'.repeat(60));
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name.padEnd(35)} ${result.duration.padStart(8)}`);
  });
  
  if (failureCount > 0) {
    console.log('\n⚠️  Some tests failed. Please check the output above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed successfully!');
  }
}

// Handle interruption
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test suite interrupted by user');
  process.exit(1);
});

// Run the tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite failed with error:', error);
  process.exit(1);
});