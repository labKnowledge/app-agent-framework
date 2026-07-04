import { describe, it, expect } from 'vitest';
import {
  buildMessages,
  buildUserPrompt,
  toolDescriptorsFromNames,
} from '../prompt-builder';
import type { AgentObservation } from '@gakwaya/app-agent-entities';

const observation: AgentObservation = {
  appState: {
    currentView: '/dashboard',
    user: { id: 'admin', role: 'admin', isAuthenticated: true },
    context: {},
    timestamp: Date.now(),
  },
  domState: {
    url: 'https://example.com/dashboard',
    title: 'Dashboard',
    content: '[0]*<button />\n    Attendance',
    header: 'Page: Dashboard',
    footer: 'Interactive elements: 1 | Total nodes: 10',
  },
  observations: ['Warning: No interactive elements found on page'],
  stepNumber: 1,
  totalWaitTime: 0,
};

const tools = toolDescriptorsFromNames([
  { name: 'click', description: 'Click an interactive element by its index' },
  { name: 'navigate', description: 'Navigate to a URL or in-app path' },
  { name: 'wait', description: 'Wait for a specified amount of time' },
]);

describe('prompt-builder', () => {
  it('includes interactive elements and tool catalog in user prompt', () => {
    const prompt = buildUserPrompt('mark attendance', observation, [], tools);

    expect(prompt).toContain('Interactive Elements:');
    expect(prompt).toContain('[0]*<button />');
    expect(prompt).toContain('Available actions');
    expect(prompt).toContain('- click: Click an interactive element by its index');
    expect(prompt).toContain('- navigate: Navigate to a URL or in-app path');
    expect(prompt).not.toContain('action_name');
  });

  it('guides the model when no interactive elements are indexed', () => {
    const emptyDomObservation: AgentObservation = {
      ...observation,
      domState: { ...observation.domState, content: '' },
    };

    const prompt = buildUserPrompt('mark attendance', emptyDomObservation, [], tools);

    expect(prompt).toContain('no indexed elements found');
    expect(prompt).toContain('registered navigation/capabilities');
  });

  it('buildMessages attaches system prompt with correct action examples', () => {
    const messages = buildMessages('task', observation, [], undefined, undefined, tools);

    expect(messages).toHaveLength(2);
    expect(messages[0].content).toContain('{ "click": { "index": 0 } }');
    expect(messages[0].content).toContain('Do NOT use "action_name"');
    expect(messages[1].content).toContain('Interactive Elements:');
  });

  it('includes app map before DOM when appContext provided', () => {
    const messages = buildMessages('task', observation, [], undefined, undefined, tools, {
      appContext: {
        navigation: [
          {
            id: 'attendance',
            path: '/attendance',
            label: 'Attendance',
            category: 'page',
          },
        ],
        capabilities: [
          {
            id: 'changeLanguage',
            name: 'Change Language',
            description: 'Set locale',
            kind: 'setting',
            toolName: 'setLanguage',
          },
        ],
      },
    });

    const user = messages[1].content;
    const mapIndex = user.indexOf('Application Map');
    const domIndex = user.indexOf('DOM Fallback');
    expect(mapIndex).toBeGreaterThan(-1);
    expect(domIndex).toBeGreaterThan(mapIndex);
    expect(user).toContain('changeLanguage');
  });

  it('includes assistant rules in system prompt by default', () => {
    const messages = buildMessages('what is in my cart?', observation, [], undefined, undefined, tools);

    expect(messages[0].content).toContain('application assistant');
    expect(messages[0].content).toContain('Assistant rules:');
    expect(messages[0].content).toContain('{ "done": true, "memory":');
  });

  it('uses agent identity when behaviorMode is agent', () => {
    const messages = buildMessages('task', observation, [], undefined, undefined, tools, {
      behaviorMode: 'agent',
    });

    expect(messages[0].content).toContain('application agent');
    expect(messages[0].content).not.toContain('Assistant rules:');
  });

  it('includes page navigation section before DOM fallback', () => {
    const messages = buildMessages('go to settings', observation, [], undefined, undefined, tools, {
      appContext: {
        navigation: [],
        capabilities: [],
        pageNavigation: {
          links: [
            {
              label: 'Settings',
              href: '/settings',
              region: 'sidebar',
              visible: false,
            },
          ],
          toggles: [
            {
              label: 'Open menu',
              region: 'header',
              ariaExpanded: false,
              controlsHiddenLinks: true,
            },
          ],
          scannedRegions: ['header', 'sidebar'],
          summary: '• [toggle|header] "Open menu" (closed)\n• [sidebar|hidden] Settings → /settings',
        },
      },
    });

    const user = messages[1].content;
    const pageNavIndex = user.indexOf('Page Navigation');
    const domIndex = user.indexOf('DOM Fallback');
    expect(pageNavIndex).toBeGreaterThan(-1);
    expect(domIndex).toBeGreaterThan(pageNavIndex);
    expect(user).toContain('Settings → /settings');
  });
});
