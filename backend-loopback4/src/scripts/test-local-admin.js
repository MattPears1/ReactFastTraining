const axios = require('axios');

async function testLocalAdmin() {
  try {
    console.log('🔐 Testing local admin login...');
    
    // Test login
    const loginResponse = await axios.post('http://localhost:3000/api/admin/auth/login', {
      email: 'lex@reactfasttraining.co.uk',
      password: 'Bumblebee21!'
    });
    
    console.log('✅ Login successful!');
    console.log('📧 User:', loginResponse.data.user);
    console.log('🎫 Token received:', loginResponse.data.accessToken ? 'Yes' : 'No');
    
    // Test /me endpoint
    const meResponse = await axios.get('http://localhost:3000/api/admin/auth/me', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.accessToken}`
      }
    });
    
    console.log('✅ /me endpoint successful!');
    console.log('👤 User data:', meResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Status:', error.response.status);
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testLocalAdmin();