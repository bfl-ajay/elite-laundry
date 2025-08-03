#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running Employee Dashboard Enhancement Backend Tests...\n');

// Test files to run
const testFiles = [
  'tests/routes/metrics.test.js',
  'tests/routes/orders-search.test.js',
  'tests/database/performance.test.js'
];

// Jest configuration
const jestConfig = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'models/**/*.js',
    'config/**/*.js',
    '!tests/**',
    '!coverage/**',
    '!node_modules/**'
  ]
};

// Create temporary jest config file
const fs = require('fs');
const jestConfigPath = path.join(__dirname, '..', 'jest.config.js');
fs.writeFileSync(jestConfigPath, `module.exports = ${JSON.stringify(jestConfig, null, 2)};`);

// Run tests
const jest = spawn('npx', ['jest', ...testFiles], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

jest.on('close', (code) => {
  // Clean up config file
  if (fs.existsSync(jestConfigPath)) {
    fs.unlinkSync(jestConfigPath);
  }

  if (code === 0) {
    console.log('\n✅ All backend tests passed!');
  } else {
    console.log('\n❌ Some tests failed. Please check the output above.');
    process.exit(code);
  }
});

jest.on('error', (error) => {
  console.error('Error running tests:', error);
  process.exit(1);
});