/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  coverageReporters:[
    "lcov", "text"
  ],
  testPathIgnorePatterns:[
      'out/test',
  ],
  "modulePaths": ["src","node_modules\@types\vscode"],
  coverageThreshold:{
      global:{
          branches:50,
          functions:50,
          lines:50,
          statements:50
      }
  }
};