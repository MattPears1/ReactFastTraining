// ULTRA SIMPLE TEST ENDPOINT
const testLogin = (req, res) => {
  console.log('🚨 TEST LOGIN ENDPOINT HIT');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  // Always return success
  res.json({
    success: true,
    message: 'TEST LOGIN WORKING',
    accessToken: 'test-token-123',
    user: {
      id: 1,
      email: 'lex@reactfasttraining.co.uk',
      name: 'Lex Admin',
      role: 'admin'
    }
  });
};

module.exports = { testLogin };