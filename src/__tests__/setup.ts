// Test setup file
// This file runs before each test file

// Mock console.log for cleaner test output
const originalLog = console.log;
console.log = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'test' || process.env.VERBOSE_TESTS) {
    originalLog(...args);
  }
};

// Global test setup can go here
export {};