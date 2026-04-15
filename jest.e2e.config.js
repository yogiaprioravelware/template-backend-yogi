module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/e2e/**/*.test.js", "**/tests/integration/**/*.test.js"],
  clearMocks: true,
  globalSetup: "<rootDir>/tests/e2e/global-setup.js",
  globalTeardown: "<rootDir>/tests/e2e/global-teardown.js",
  setupFilesAfterEnv: ["<rootDir>/tests/e2e/setup.js"],
  collectCoverage: false,
  verbose: true,
  testTimeout: 30000
};
