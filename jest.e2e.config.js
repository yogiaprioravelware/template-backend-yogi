module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/e2e/**/*.test.js", "**/tests/integration/**/*.test.js"],
  clearMocks: true,
  setupFilesAfterEnv: ["<rootDir>/tests/e2e/setup.js"],
  collectCoverage: false,
  verbose: true,
  testTimeout: 30000
};
