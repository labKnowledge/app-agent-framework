/**
 * Test setup file
 * Runs before all tests
 */

function hasRealDomEnvironment(): boolean {
  try {
    return (
      typeof document !== 'undefined' &&
      typeof document.createElement === 'function' &&
      document.createElement('div').nodeType === 1
    );
  } catch {
    return false;
  }
}

// Only stub DOM globals when no jsdom/happy-dom environment is active
if (!hasRealDomEnvironment()) {
  global.window = {
    location: {
      href: 'http://localhost:3000',
    },
    scrollY: 0,
    scrollX: 0,
    matchMedia: () => ({
      matches: false,
    }),
    dispatchEvent: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  } as any;

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
      scrollHeight: 1000,
      scrollWidth: 1000,
      clientHeight: 800,
      clientWidth: 1200,
      scrollTop: 0,
      scrollLeft: 0,
    },
    title: 'Test Page',
  } as any;
}

console.log('[Test Setup] Environment initialized');
