/**
 * Test setup file
 * Runs before all tests
 */

// Mock DOM environment for Node.js testing
global.document = {
  createElement: () => ({
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    appendChild: () => {},
    removeChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  body: {
    appendChild: () => {},
    removeChild: () => {},
  },
  documentElement: {
    innerHTML: '',
  },
  title: 'Test Page',
} as any;

global.window = {
  location: {
    href: 'http://localhost:3000',
  },
  matchMedia: () => ({
    matches: false,
  }),
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
} as any;

console.log('[Test Setup] Environment initialized');
