const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');
    
    // Test login
    const loginResponse = await axios.post('https://api.reactfasttraining.co.uk/api/admin/auth/login', {
      email: 'lex@reactfasttraining.co.uk',
      password: 'Bumblebee21!'
    });
    
    console.log('✅ Login successful!');
    console.log('📧 User:', loginResponse.data.user);
    console.log('🎫 Token received:', loginResponse.data.accessToken ? 'Yes' : 'No');
    
    // Test /me endpoint
    const meResponse = await axios.get('https://api.reactfasttraining.co.uk/api/admin/auth/me', {
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

testAdminLogin();