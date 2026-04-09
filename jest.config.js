module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/config/',
    '/migrations/',
    '/seeders/'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  clearMocks: true
};
