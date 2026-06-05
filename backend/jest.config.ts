import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  testMatch: ["**/*.test.ts"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config;
