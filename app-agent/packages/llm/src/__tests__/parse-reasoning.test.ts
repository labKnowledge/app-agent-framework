import { describe, it, expect } from 'vitest';
import {
  normalizeActionShape,
  parseReasoningContent,
  stripMarkdownFences,
} from '../parse-reasoning';

describe('parse-reasoning', () => {
  describe('stripMarkdownFences', () => {
    it('strips json code fences', () => {
      const input = '```json\n{"a":1}\n```';
      expect(stripMarkdownFences(input)).toBe('{"a":1}');
    });

    it('returns plain JSON unchanged', () => {
      expect(stripMarkdownFences('{"a":1}')).toBe('{"a":1}');
    });
  });

  describe('normalizeActionShape', () => {
    it('passes through valid single-key actions', () => {
      expect(normalizeActionShape({ click: { index: 2 } })).toEqual({ click: { index: 2 } });
    });

    it('normalizes HAR-style action_name + parameters', () => {
      expect(
        normalizeActionShape({
          action_name: 'click_element',
          parameters: { element_description: 'Attendance tab' },
        })
      ).toEqual({ click: { element_description: 'Attendance tab' } });
    });

    it('normalizes navigate_to_url with url parameter', () => {
      expect(
        normalizeActionShape({
          action_name: 'navigate_to_url',
          parameters: { url: 'https://kids.eligapris.tech/attendance' },
        })
      ).toEqual({ navigate: { path: 'https://kids.eligapris.tech/attendance' } });
    });

    it('normalizes name + params shape', () => {
      expect(
        normalizeActionShape({
          name: 'wait',
          parameters: { duration: 2000 },
        })
      ).toEqual({ wait: { duration: 2000 } });
    });

    it('rejects empty action objects', () => {
      expect(() => normalizeActionShape({})).toThrow('Invalid action');
    });
  });

  describe('parseReasoningContent', () => {
    it('parses valid reasoning JSON', () => {
      const result = parseReasoningContent(
        JSON.stringify({
          evaluation_previous_goal: 'ok',
          memory: 'test',
          next_goal: 'click',
          action: { click: { index: 0 } },
        })
      );

      expect(result.nextGoal).toBe('click');
      expect(result.action).toEqual({ click: { index: 0 } });
    });

    it('parses HAR production response shape', () => {
      const harContent = JSON.stringify({
        evaluation_previous_goal: 'Need attendance',
        memory: 'Admin on dashboard',
        next_goal: 'Open attendance',
        action: {
          action_name: 'navigate_to_url',
          parameters: { url: 'https://kids.eligapris.tech/attendance' },
        },
      });

      const result = parseReasoningContent(harContent);
      expect(result.action).toEqual({
        navigate: { path: 'https://kids.eligapris.tech/attendance' },
      });
    });

    it('parses fenced JSON from LLM output', () => {
      const fenced = `\`\`\`json
${JSON.stringify({
  evaluation_previous_goal: 'ok',
  memory: 'm',
  next_goal: 'wait',
  action: { wait: { duration: 1000 } },
})}
\`\`\``;

      const result = parseReasoningContent(fenced);
      expect(result.action).toEqual({ wait: { duration: 1000 } });
    });
  });
});
