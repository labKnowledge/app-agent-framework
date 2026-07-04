import { describe, it, expect } from 'vitest';
import { matchWorkflow, matchCustomTool } from '../intent-router';

describe('intent-router', () => {
  it('matches workflow by name overlap', () => {
    const match = matchWorkflow('go to attendance page', [
      { id: 'check-in', name: 'check in', description: 'Mark child attendance' },
      { id: 'attendance', name: 'attendance', description: 'View attendance records' },
    ]);

    expect(match?.workflowId).toBe('attendance');
    expect(match?.score).toBeGreaterThan(0.45);
  });

  it('matches custom application tool', () => {
    const tool = matchCustomTool('mark all kids attendance for today', [
      { name: 'markAttendance', description: 'Mark attendance for all children' },
      { name: 'exportReport', description: 'Export CSV report' },
    ]);

    expect(tool).toBe('markAttendance');
  });

  it('returns null when no workflow matches', () => {
    const match = matchWorkflow('hello', [{ id: 'x', name: 'checkout' }]);
    expect(match).toBeNull();
  });
});
