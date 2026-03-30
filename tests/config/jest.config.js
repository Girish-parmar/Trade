module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/../frontend'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../frontend/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/setup-tests.js'],
  collectCoverageFrom: [
    '../frontend/src/**/*.{js,jsx,ts,tsx}',
    '!../frontend/src/**/*.d.ts',
    '!../frontend/src/**/*.stories.{js,jsx,ts,tsx}',
    '!../frontend/src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
  testTimeout: 10000,
};