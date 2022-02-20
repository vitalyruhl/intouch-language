/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const path = require('path') //https://github.com/microsoft/vscode-test/issues/37

module.exports = {
  preset: 'ts-jest',
  testEnvironment: './src/test/vscode-environment.js',
  coverageReporters:[
    "lcov", "text"
  ],
  testPathIgnorePatterns:[
      'out/test',
  ],
  moduleNameMapper: {
    vscode: path.join(__dirname, 'test-jest', 'vscode.js')  // <----- most important line
  },
  modulePaths: ['<rootDir>'],
  coverageThreshold:{
      global:{
          branches:50,
          functions:50,
          lines:50,
          statements:50
      }
  }
};