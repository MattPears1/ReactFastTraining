const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('base64');
}

function updateEnvFile() {
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.error('Error reading .env file:', error);
    process.exit(1);
  }
  
  // Generate new secrets
  const newJwtSecret = generateSecureSecret();
  const newJwtRefreshSecret = generateSecureSecret();
  const csrfSecret = generateSecureSecret(32);
  
  // Update JWT secrets
  envContent = envContent.replace(
    /JWT_SECRET=.*/,
    `JWT_SECRET=${newJwtSecret}`
  );
  
  envContent = envContent.replace(
    /JWT_REFRESH_SECRET=.*/,
    `JWT_REFRESH_SECRET=${newJwtRefreshSecret}`
  );
  
  // Add CSRF secret if not exists
  if (!envContent.includes('CSRF_SECRET=')) {
    envContent += `\n# CSRF Protection\nCSRF_SECRET=${csrfSecret}\n`;
  }
  
  // Add session secret if not exists
  if (!envContent.includes('SESSION_SECRET=')) {
    const sessionSecret = generateSecureSecret();
    envContent += `\n# Session Configuration\nSESSION_SECRET=${sessionSecret}\n`;
  }
  
  // Write back to file
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Secrets generated successfully!');
  console.log('⚠️  IMPORTANT: Make sure to restart your server for changes to take effect.');
  console.log('⚠️  NEVER commit the .env file to version control!');
}

// Run if called directly
if (require.main === module) {
  updateEnvFile();
}

module.exports = { generateSecureSecret };