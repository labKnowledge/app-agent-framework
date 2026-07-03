/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DOMProcessor } from '../dom/processor';

function mockElementGeometry() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 120,
    height: 32,
    top: 0,
    left: 0,
    bottom: 32,
    right: 120,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
}

describe('DOMProcessor interactive detection', () => {
  let processor: DOMProcessor;

  beforeEach(() => {
    processor = new DOMProcessor();
    document.body.innerHTML = '';
    mockElementGeometry();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('detects MUI-style role=button divs as interactive', () => {
    document.body.innerHTML = `
      <nav>
        <div role="button" tabindex="0">Attendance</div>
        <div role="tab">Dashboard</div>
      </nav>
    `;

    const tree = processor.getFlatTree();
    expect(tree.interactiveElements.size).toBeGreaterThanOrEqual(2);

    const content = processor.dehydrateTree(tree);
    expect(content).toContain('Attendance');
    expect(content).toContain('Dashboard');
  });

  it('does not treat non-interactive roles as clickable', () => {
    document.body.innerHTML = `
      <div role="presentation">Decorative</div>
      <main><p>Hello</p></main>
    `;

    const tree = processor.getFlatTree();
    expect(tree.interactiveElements.size).toBe(0);
    expect(processor.dehydrateTree(tree)).toBe('');
  });
});
