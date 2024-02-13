/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    roots: [
      "./tests"
    ],
    testEnvironment: "node",
    preset: "@shelf/jest-mongodb",
    coverageDirectory: 'coverage',
    transform: {
      ".+\\.ts$": "ts-jest",
    },
  };