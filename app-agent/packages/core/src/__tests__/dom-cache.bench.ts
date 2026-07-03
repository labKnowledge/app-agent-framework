import { bench, describe } from 'vitest';
import * as ports from '../ports';
import type { FlatDOMTree } from '../dom/types';

const mockTree: FlatDOMTree = {
  rootId: 0,
  nodes: new Map(),
  interactiveElements: new Map(),
};

describe('DOM cache performance', () => {
  bench(
    'rebuild DOM tree',
    () => {
      const domEnv = ports.createBrowserDOMEnvironment();
      domEnv.processor.getFlatTree();
    },
    { time: 300 }
  );

  bench(
    'checksum only (cache path)',
    () => {
      const domEnv = ports.createBrowserDOMEnvironment();
      domEnv.port.getChecksum();
      void mockTree;
    },
    { time: 300 }
  );
});
