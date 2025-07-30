const axios = require('axios');

async function testBypassLogin() {
  console.log('🔐 Testing hardcoded bypass login...');
  
  try {
    // Test with exact hardcoded credentials
    const response = await axios.post('https://api.reactfasttraining.co.uk/api/admin/auth/login', {
      email: 'lex@reactfasttraining.co.uk',
      password: 'Bumblebee21!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ LOGIN SUCCESSFUL!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Login failed');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Also test with curl command
console.log('\n📋 You can also test with this curl command:');
console.log(`curl -X POST https://api.reactfasttraining.co.uk/api/admin/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"lex@reactfasttraining.co.uk","password":"Bumblebee21!"}'`);

testBypassLogin();