/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'esnext',
          target: 'esnext',
        },
      },
    ],
  },
  testTimeout: 30000, // Set default timeout to 30 seconds
  extensionsToTreatAsEsm: ['.ts'],
};
