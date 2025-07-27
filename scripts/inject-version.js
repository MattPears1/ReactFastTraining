#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function injectVersion() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const envFilePath = path.join(__dirname, '..', '.env.local');
  
  try {
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version;
    const buildTime = new Date().toISOString();
    
    // Create .env.local with version info
    const envContent = `# Auto-generated version info - DO NOT EDIT MANUALLY
VITE_APP_VERSION=${version}
VITE_BUILD_TIME=${buildTime}
VITE_BUILD_TIMESTAMP=${Date.now()}
`;
    
    fs.writeFileSync(envFilePath, envContent);
    
    console.log(`✅ Injected version ${version} into environment`);
    console.log(`🕒 Build time: ${buildTime}`);
    
    return { version, buildTime };
  } catch (error) {
    console.error('❌ Error injecting version:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  injectVersion();
}

module.exports = injectVersion;