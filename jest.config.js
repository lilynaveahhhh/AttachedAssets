/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@/(.*)$': '<rootDir>/client/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  collectCoverageFrom: [
    'server/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    '!server/**/*.d.ts',
    '!server/vite.ts',
  ],
  coverageReporters: ['text', 'lcov'],
  setupFiles: ['<rootDir>/test/setup.ts']
};