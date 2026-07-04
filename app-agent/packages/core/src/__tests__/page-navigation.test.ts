/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { extractPageNavigation, serializePageNavigation } from '../dom/page-navigation';

function mockVisibleGeometry() {
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

describe('extractPageNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    mockVisibleGeometry();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('collects visible header and footer links', () => {
    document.body.innerHTML = `
      <header>
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/attendance">Attendance</a>
        </nav>
      </header>
      <main><h1>Home</h1></main>
      <footer>
        <a href="/privacy">Privacy</a>
      </footer>
    `;

    const snapshot = extractPageNavigation({ currentPath: '/dashboard' });

    expect(snapshot.links.some((l) => l.label === 'Dashboard' && l.href === '/dashboard')).toBe(
      true
    );
    expect(snapshot.links.some((l) => l.label === 'Attendance')).toBe(true);
    expect(snapshot.links.some((l) => l.label === 'Privacy' && l.region === 'footer')).toBe(true);
    expect(snapshot.links.find((l) => l.label === 'Dashboard')?.current).toBe(true);
    expect(snapshot.summary).toContain('Dashboard');
    expect(snapshot.summary).toContain('Privacy');
  });

  it('includes hidden hamburger menu links without expanding the menu', () => {
    document.body.innerHTML = `
      <header>
        <button aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-nav">
          Menu
        </button>
        <nav id="mobile-nav" hidden>
          <a href="/settings">Settings</a>
          <a href="/profile">Profile</a>
        </nav>
      </header>
    `;

    const snapshot = extractPageNavigation();

    expect(snapshot.toggles.some((t) => t.label.includes('navigation menu'))).toBe(true);
    expect(snapshot.toggles[0]?.controlsHiddenLinks).toBe(true);
    expect(snapshot.links.some((l) => l.href === '/settings' && l.visible === false)).toBe(true);
    expect(snapshot.links.some((l) => l.href === '/profile' && l.visible === false)).toBe(true);
    expect(snapshot.summary).toContain('|hidden');
    expect(snapshot.summary).toContain('toggle');
  });

  it('finds sidebar links in aside landmarks', () => {
    document.body.innerHTML = `
      <aside class="app-sidebar">
        <nav>
          <a href="/children">Children</a>
          <a href="/reports">Reports</a>
        </nav>
      </aside>
    `;

    const snapshot = extractPageNavigation();

    expect(snapshot.scannedRegions).toContain('sidebar');
    expect(snapshot.links.some((l) => l.region === 'sidebar' && l.href === '/children')).toBe(true);
  });

  it('dedupes links and respects maxLinks budget', () => {
    document.body.innerHTML = `
      <nav>
        ${Array.from({ length: 50 }, (_, i) => `<a href="/page-${i}">Page ${i}</a>`).join('')}
      </nav>
    `;

    const snapshot = extractPageNavigation({ maxLinks: 10 });
    expect(snapshot.links.length).toBe(10);
  });

  it('serializePageNavigation truncates long output', () => {
    const lines = Array.from({ length: 40 }, (_, i) => ({
      label: `Link ${i}`,
      href: `/p-${i}`,
      region: 'main-nav' as const,
      visible: true,
    }));

    const text = serializePageNavigation({ links: lines, toggles: [], scannedRegions: ['main-nav'] }, 200);
    expect(text.length).toBeLessThanOrEqual(220);
    expect(text).toContain('omitted');
  });

  it('extracts breadcrumb navigation', () => {
    document.body.innerHTML = `
      <nav aria-label="Breadcrumb">
        <ol class="breadcrumb">
          <li><a href="/">Home</a></li>
          <li><a href="/products">Products</a></li>
          <li><a href="/products/electronics">Electronics</a></li>
          <li aria-current="page">Smartphones</li>
        </ol>
      </nav>
    `;

    const snapshot = extractPageNavigation({ currentPath: '/products/electronics/smartphones' });

    expect(snapshot.links.some((l) => l.label.includes('📍') && l.href === '/')).toBe(true);
    expect(snapshot.links.some((l) => l.label.includes('📍') && l.href === '/products')).toBe(true);
    expect(snapshot.summary).toContain('📍');
  });

  it('extracts pagination controls', () => {
    document.body.innerHTML = `
      <nav aria-label="Pagination">
        <ul class="pagination">
          <li><a href="/page-1">Previous</a></li>
          <li><a href="/page-1">1</a></li>
          <li class="active"><span>2</span></li>
          <li><a href="/page-3">3</a></li>
          <li><a href="/page-3">Next</a></li>
        </ul>
      </nav>
    `;

    const snapshot = extractPageNavigation({ currentPath: '/page-2' });

    expect(snapshot.links.some((l) => l.label.includes('📄') && l.label.includes('Previous'))).toBe(true);
    expect(snapshot.links.some((l) => l.label.includes('📄') && l.label.includes('Next'))).toBe(true);
    expect(snapshot.summary).toContain('📄');
  });

  it('extracts tab navigation', () => {
    document.body.innerHTML = `
      <div role="tablist">
        <button role="tab" aria-selected="true" aria-controls="panel1">Overview</button>
        <button role="tab" aria-selected="false" aria-controls="panel2">Features</button>
        <button role="tab" aria-selected="false" aria-controls="panel3">Pricing</button>
      </div>
      <div id="panel1">Overview content</div>
      <div id="panel2">Features content</div>
      <div id="panel3">Pricing content</div>
    `;

    const snapshot = extractPageNavigation();

    expect(snapshot.links.some((l) => l.label.includes('🏷️') && l.label.includes('Overview'))).toBe(true);
    expect(snapshot.links.some((l) => l.label.includes('🏷️') && l.label.includes('Features'))).toBe(true);
    expect(snapshot.links.some((l) => l.current && l.label.includes('Overview'))).toBe(true);
    expect(snapshot.summary).toContain('🏷️');
  });

  it('handles comprehensive modern navigation with all patterns', () => {
    document.body.innerHTML = `
      <header class="navbar">
        <button aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-nav">
          ☰
        </button>
        <nav class="main-nav">
          <a href="/home" class="active">Home</a>
          <a href="/products">Products</a>
          <a href="/solutions">Solutions</a>
          <a href="/pricing">Pricing</a>
        </nav>
      </header>

      <nav aria-label="Breadcrumb">
        <ol class="breadcrumb">
          <li><a href="/">Home</a></li>
          <li><a href="/products">Products</a></li>
        </ol>
      </nav>

      <aside class="sidebar">
        <nav>
          <a href="/products/all">All Products</a>
          <a href="/products/new">New Arrivals</a>
          <a href="/products/sale">Sale</a>
        </nav>
      </aside>

      <main>
        <div role="tablist">
          <button role="tab" aria-selected="true" aria-controls="desc">Description</button>
          <button role="tab" aria-selected="false" aria-controls="specs">Specifications</button>
          <button role="tab" aria-selected="false" aria-controls="reviews">Reviews</button>
        </div>
        <div id="desc">Product description</div>
        <div id="specs">Product specs</div>
        <div id="reviews">Product reviews</div>
      </main>

      <footer>
        <nav class="footer-nav">
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/privacy">Privacy</a>
        </nav>
        <nav aria-label="Pagination">
          <ul class="pagination">
            <li><a href="/page-1">«</a></li>
            <li class="active"><span>Page 1</span></li>
            <li><a href="/page-2">Page 2</a></li>
            <li><a href="/page-2">»</a></li>
          </ul>
        </nav>
      </footer>

      <div id="mobile-nav" class="mobile-nav" hidden>
        <a href="/mobile-home">Mobile Home</a>
        <a href="/mobile-products">Products</a>
        <a href="/mobile-settings">Settings</a>
      </div>
    `;

    const snapshot = extractPageNavigation({ currentPath: '/products' });

    // Header navigation
    expect(snapshot.links.some((l) => l.region === 'header' && l.label.includes('Home'))).toBe(true);
    expect(snapshot.links.some((l) => l.region === 'header' && l.href === '/products')).toBe(true);

    // Breadcrumbs
    expect(snapshot.links.some((l) => l.label.includes('📍'))).toBe(true);

    // Sidebar
    expect(snapshot.links.some((l) => l.region === 'sidebar' && l.href === '/products/all')).toBe(true);

    // Tabs
    expect(snapshot.links.some((l) => l.label.includes('🏷️') && l.label.includes('Description'))).toBe(true);

    // Footer
    expect(snapshot.links.some((l) => l.region === 'footer' && l.href === '/about')).toBe(true);

    // Pagination
    expect(snapshot.links.some((l) => l.label.includes('📄'))).toBe(true);

    // Hidden mobile menu
    expect(snapshot.toggles.some((t) => t.label.includes('navigation menu'))).toBe(true);
    expect(snapshot.links.some((l) => l.href === '/mobile-home' && l.visible === false)).toBe(true);

    // Current page marking
    expect(snapshot.links.find((l) => l.href === '/products')?.current).toBe(true);

    // Summary includes metadata
    expect(snapshot.summary).toBeTruthy();
    expect(snapshot.summary.length).toBeGreaterThan(0);
  });

  it('respects configuration flags', () => {
    document.body.innerHTML = `
      <nav aria-label="Breadcrumb">
        <ol class="breadcrumb">
          <li><a href="/">Home</a></li>
        </ol>
      </nav>
      <nav aria-label="Pagination">
        <ul class="pagination">
          <li><a href="/page-2">Next</a></li>
        </ul>
      </nav>
      <div role="tablist">
        <button role="tab" aria-selected="true" aria-controls="panel1">Tab 1</button>
      </div>
    `;

    const withAll = extractPageNavigation({
      includeBreadcrumbs: true,
      includePagination: true,
      includeTabs: true,
    });
    expect(withAll.links.length).toBeGreaterThan(0);

    const withoutBreadcrumbs = extractPageNavigation({ includeBreadcrumbs: false });
    expect(withoutBreadcrumbs.links.some((l) => l.label.includes('📍'))).toBe(false);

    const withoutPagination = extractPageNavigation({ includePagination: false });
    expect(withoutPagination.links.some((l) => l.label.includes('📄'))).toBe(false);

    const withoutTabs = extractPageNavigation({ includeTabs: false });
    expect(withoutTabs.links.some((l) => l.label.includes('🏷️'))).toBe(false);
  });

  it('handles edge cases gracefully', () => {
    // Empty document
    document.body.innerHTML = '';
    const empty = extractPageNavigation();
    expect(empty.links.length).toBe(0);
    expect(empty.toggles.length).toBe(0);
    expect(empty.summary).toBe('');

    // Links with javascript: and # hrefs should be filtered
    document.body.innerHTML = `
      <nav>
        <a href="javascript:void(0)">JS Link</a>
        <a href="#">Anchor Link</a>
        <a href="/valid">Valid Link</a>
      </nav>
    `;
    const filtered = extractPageNavigation();
    expect(filtered.links.some((l) => l.href.startsWith('javascript:'))).toBe(false);
    expect(filtered.links.some((l) => l.href === '#')).toBe(false);
    expect(filtered.links.some((l) => l.href === '/valid')).toBe(true);
  });
});
