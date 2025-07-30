#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function bumpVersion() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  try {
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Parse current version
    const versionParts = packageJson.version.split('.');
    const major = parseInt(versionParts[0], 10);
    const minor = parseInt(versionParts[1], 10);
    const patch = parseInt(versionParts[2], 10);
    
    // Bump patch version
    const newVersion = `${major}.${minor}.${patch + 1}`;
    
    // Update package.json
    packageJson.version = newVersion;
    
    // Write back to file
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log(`✅ Version bumped from ${versionParts.join('.')} to ${newVersion}`);
    console.log(`📦 Building with version ${newVersion}...`);
    
    return newVersion;
  } catch (error) {
    console.error('❌ Error bumping version:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  bumpVersion();
}

module.exports = bumpVersion;