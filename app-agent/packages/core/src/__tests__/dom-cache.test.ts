import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppAgentCore } from '../agent';
import type { AgentConfig, AppState } from '../types';
import * as ports from '../ports';
import type { FlatDOMTree } from '../dom/types';

describe('AppAgentCore DOM cache', () => {
  let agent: AppAgentCore;
  let getFlatTreeSpy: ReturnType<typeof vi.spyOn>;
  let getChecksumSpy: ReturnType<typeof vi.spyOn>;

  const mockTree: FlatDOMTree = {
    rootId: 0,
    nodes: new Map(),
    interactiveElements: new Map(),
  };

  const mockAppState: AppState = {
    currentView: 'shop',
    user: { id: 'u1', role: 'user', isAuthenticated: true },
    context: {},
    timestamp: Date.now(),
  };

  const config: AgentConfig = {
    baseURL: 'https://api.example.com',
    model: 'test-model',
    getAppState: async () => mockAppState,
  };

  beforeEach(() => {
    const domEnv = ports.createBrowserDOMEnvironment();
    getFlatTreeSpy = vi.spyOn(domEnv.processor, 'getFlatTree').mockReturnValue(mockTree);
    getChecksumSpy = vi.spyOn(domEnv.port, 'getChecksum').mockReturnValue('checksum-1');

    vi.spyOn(ports, 'createBrowserDOMEnvironment').mockReturnValue(domEnv);

    agent = new AppAgentCore(config);
  });

  afterEach(() => {
    agent.dispose();
  });

  it('reuses DOM tree when checksum is unchanged', async () => {
    const observe = (agent as unknown as { observe: () => Promise<unknown> }).observe.bind(agent);

    await observe();
    await observe();

    expect(getFlatTreeSpy).toHaveBeenCalledTimes(1);
    expect(getChecksumSpy).toHaveBeenCalled();
  });

  it('rebuilds DOM when checksum changes', async () => {
    const observe = (agent as unknown as { observe: () => Promise<unknown> }).observe.bind(agent);

    await observe();
    getChecksumSpy.mockReturnValue('checksum-2');
    await observe();

    expect(getFlatTreeSpy).toHaveBeenCalledTimes(2);
  });

  it('rebuilds DOM after cache TTL expires', async () => {
    const observe = (agent as unknown as { observe: () => Promise<unknown> }).observe.bind(agent);
    let currentTime = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    await observe();
    currentTime += 6000;
    await observe();

    expect(getFlatTreeSpy).toHaveBeenCalledTimes(2);
  });

  it('rebuilds DOM when URL changes', async () => {
    const observe = (agent as unknown as { observe: () => Promise<unknown> }).observe.bind(agent);
    const getLocationHrefSpy = vi.spyOn(
      (agent as unknown as { domEnv: { port: { getLocationHref: () => string } } }).domEnv.port,
      'getLocationHref'
    );

    getLocationHrefSpy.mockReturnValue('https://example.com/dashboard');
    await observe();

    getLocationHrefSpy.mockReturnValue('https://example.com/attendance');
    await observe();

    expect(getFlatTreeSpy).toHaveBeenCalledTimes(2);
  });
});
