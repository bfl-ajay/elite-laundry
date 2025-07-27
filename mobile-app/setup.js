#!/usr/bin/env node

/**
 * Elite Laundry Mobile App Setup Script
 * This script helps configure the mobile app for your environment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('🚀 Elite Laundry Mobile App Setup');
  console.log('=====================================\n');

  try {
    // Get web app URL
    const webAppUrl = await question('Enter your web app URL (e.g., https://your-domain.com): ');
    
    // Get API base URL
    const apiBaseUrl = await question('Enter your API base URL (e.g., https://your-domain.com/api): ');
    
    // Get app name (optional)
    const appName = await question('Enter app name (default: Elite Laundry): ') || 'Elite Laundry';
    
    // Update AppConfig.js
    const configPath = path.join(__dirname, 'src', 'config', 'AppConfig.js');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    configContent = configContent.replace(
      /webAppUrl: '.*?'/,
      `webAppUrl: '${webAppUrl}'`
    );
    
    configContent = configContent.replace(
      /apiBaseUrl: '.*?'/,
      `apiBaseUrl: '${apiBaseUrl}'`
    );
    
    configContent = configContent.replace(
      /appName: '.*?'/,
      `appName: '${appName}'`
    );
    
    fs.writeFileSync(configPath, configContent);
    
    // Update strings.xml
    const stringsPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
    let stringsContent = fs.readFileSync(stringsPath, 'utf8');
    
    stringsContent = stringsContent.replace(
      /<string name="app_name">.*?<\/string>/,
      `<string name="app_name">${appName}</string>`
    );
    
    fs.writeFileSync(stringsPath, stringsContent);
    
    console.log('\n✅ Configuration updated successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm run android');
    console.log('\nFor more information, see README.md');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

setup();