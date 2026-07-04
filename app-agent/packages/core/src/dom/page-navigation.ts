/**
 * Page navigation discovery — landmarks + hidden menus (ADR-0011 extension)
 *
 * Minimal DOM scan for nav links in header, sidebar, hamburger/drawer, footer, breadcrumbs,
 * pagination, and tabs. Inspired by page-agent/browser-use accessibility-first patterns,
 * W3C landmarks, D2Snap DOM downsampling research, and ARIA best practices.
 *
 * Does NOT auto-expand menus — includes hidden links + toggle hints instead.
 * Performance-conscious with token-efficient output for AI agents.
 */

import type {
  PageNavRegion,
  PageNavigationLink,
  PageNavigationSnapshot,
  PageNavToggle,
} from '@gakwaya/app-agent-entities';

export interface PageNavigationConfig {
  /** Max links in snapshot (default 48) */
  maxLinks?: number;
  /** Max menu toggles (default 8) */
  maxToggles?: number;
  /** Max chars for summary string (default 2400) */
  maxSummaryChars?: number;
  /** Current path for marking active link */
  currentPath?: string;
  /** Document root (default document) */
  root?: Document | Element;
  /** Enable breadcrumb extraction (default true) */
  includeBreadcrumbs?: boolean;
  /** Enable pagination extraction (default true) */
  includePagination?: boolean;
  /** Enable tab navigation extraction (default true) */
  includeTabs?: boolean;
}

const REGION_QUERIES: Array<{ region: PageNavRegion; selectors: string[] }> = [
  {
    region: 'main-nav',
    selectors: [
      'nav:not(header nav):not(footer nav):not(aside nav)',
      '[role="navigation"]:not(header [role="navigation"]):not(footer [role="navigation"]):not(aside [role="navigation"])',
      'nav[class*="main" i]',
      'nav[class*="primary" i]',
      'nav[id*="main" i]',
      'nav[id*="primary" i]',
      '[role="menubar"]',
      'ul[class*="nav" i]',
      'ul[class*="menu" i]',
    ],
  },
  {
    region: 'header',
    selectors: [
      'header nav',
      'header [role="navigation"]',
      '[role="banner"] nav',
      '[role="banner"] [role="navigation"]',
      'nav[class*="top" i]',
      'nav[class*="header" i]',
      'div[class*="navbar" i]',
      'div[class*="nav-bar" i]',
      '[class*="top-bar" i] nav',
      '[class*="toolbar" i] nav',
    ],
  },
  {
    region: 'footer',
    selectors: [
      'footer nav',
      'footer [role="navigation"]',
      '[role="contentinfo"] nav',
      '[role="contentinfo"] [role="navigation"]',
      'nav[class*="footer" i]',
      'nav[class*="bottom" i]',
      '[class*="footer" i] nav',
    ],
  },
  {
    region: 'sidebar',
    selectors: [
      'aside nav',
      'aside [role="navigation"]',
      'aside',
      '[class*="sidebar" i] nav',
      '[class*="side-nav" i]',
      '[class*="sidenav" i]',
      '[class*="side-nav" i] nav',
      'nav[class*="sidebar" i]',
      'nav[class*="side" i]',
      '[role="complementary"] nav',
      '[role="complementary"]',
      'div[class*="panel" i] nav',
    ],
  },
  {
    region: 'drawer',
    selectors: [
      '[class*="drawer" i] nav',
      '[class*="mobile-menu" i]',
      '[class*="mobile-nav" i]',
      '[role="dialog"] nav',
      '[role="dialog"] [role="navigation"]',
      '[class*="offcanvas" i] nav',
      '[class*="off-canvas" i] nav',
      '[class*="slide-out" i] nav',
      'div[class*="menu" i][class*="mobile" i]',
    ],
  },
];

const BREADCRUMB_SELECTORS = [
  'nav[aria-label*="breadcrumb" i]',
  'nav[aria-label*="Breadcrumb" i]',
  '[role="navigation"] ol[class*="breadcrumb" i]',
  '[role="navigation"] ul[class*="breadcrumb" i]',
  'ol[class*="breadcrumb" i]',
  'ul[class*="breadcrumb" i]',
  '[class*="breadcrumbs" i]',
  '[class*="breadcrumb" i] nav',
  '[itemscope*="BreadcrumbList" i]',
];

const PAGINATION_SELECTORS = [
  'nav[aria-label*="pagination" i]',
  'nav[aria-label*="Pagination" i]',
  '[role="navigation"][class*="pagination" i]',
  'ul[class*="pagination" i]',
  'ol[class*="pagination" i]',
  'div[class*="pagination" i]',
  '[class*="pager" i]',
  '[class*="paging" i]',
];

const TAB_SELECTORS = [
  '[role="tablist"]',
  'div[class*="tab-list" i]',
  'ul[class*="tab-list" i]',
  'div[class*="tabs" i]',
  '[role="tab"][aria-selected]',
  'button[role="tab"]',
  '[data-toggle="tab"]',
  '[data-toggle="pill"]',
];

const LINK_SELECTORS = 'a[href], [role="menuitem"], [role="link"][href], [role="tab"]';

const TOGGLE_SELECTORS = [
  'button[aria-expanded]',
  '[role="button"][aria-expanded]',
  'button[aria-haspopup="menu"]',
  '[aria-haspopup="menu"]',
  'button[aria-controls]',
  'button[class*="menu" i]',
  'button[class*="toggle" i]',
  'button[class*="hamburger" i]',
  'button[class*="sidebar" i]',
  '[class*="menu-toggle" i]',
  '[class*="nav-toggle" i]',
  'button[aria-label*="menu" i]',
  'button[aria-label*="navigation" i]',
  '[data-toggle="menu"]',
  '[data-toggle="sidebar"]',
  '[data-toggle="offcanvas"]',
].join(', ');

const MENU_LABEL_PATTERN =
  /menu|navigation|nav|sidebar|drawer|hamburger|open\s+menu|close\s+menu|toggle|show|hide|expand|collapse/i;

/**
 * Extract navigation links from page landmarks, including collapsed/hidden menus,
 * breadcrumbs, pagination, and tabs.
 */
export function extractPageNavigation(config: PageNavigationConfig = {}): PageNavigationSnapshot {
  const maxLinks = config.maxLinks ?? 48;
  const maxToggles = config.maxToggles ?? 8;
  const maxSummaryChars = config.maxSummaryChars ?? 2400;
  const includeBreadcrumbs = config.includeBreadcrumbs ?? true;
  const includePagination = config.includePagination ?? true;
  const includeTabs = config.includeTabs ?? true;
  const currentPath = normalizePath(config.currentPath ?? getLocationPath());
  const doc = config.root ?? (typeof document !== 'undefined' ? document : null);

  if (!doc) {
    return emptySnapshot();
  }

  const root = doc instanceof Document ? doc.body : doc;
  if (!root) {
    return emptySnapshot();
  }

  const scannedRegions = new Set<PageNavRegion>();
  const linkMap = new Map<string, PageNavigationLink>();
  const breadcrumbLinks: PageNavigationLink[] = [];
  const paginationLinks: PageNavigationLink[] = [];
  const tabLinks: PageNavigationLink[] = [];

  // Collect links from main regions
  for (const { region, selectors } of REGION_QUERIES) {
    for (const selector of selectors) {
      root.querySelectorAll(selector).forEach((element) => {
        if (!(element instanceof HTMLElement)) {
          return;
        }
        scannedRegions.add(region);
        collectLinksFromRegion(element, region, currentPath, linkMap);
      });
    }
  }

  // Footer often uses bare links without a nav wrapper
  root.querySelectorAll('footer a[href]').forEach((el) => {
    if (el instanceof HTMLAnchorElement) {
      addLink(linkMap, el, 'footer', currentPath);
      scannedRegions.add('footer');
    }
  });

  // Extract breadcrumbs if enabled
  if (includeBreadcrumbs) {
    for (const selector of BREADCRUMB_SELECTORS) {
      root.querySelectorAll(selector).forEach((element) => {
        if (!(element instanceof HTMLElement)) {
          return;
        }
        collectBreadcrumbs(element, currentPath, breadcrumbLinks);
      });
    }
    // Merge breadcrumbs into main link map
    breadcrumbLinks.forEach((link) => {
      const key = `${link.href}::${link.label.toLowerCase()}`;
      if (!linkMap.has(key)) {
        linkMap.set(key, link);
      }
    });
  }

  // Extract pagination if enabled
  if (includePagination) {
    for (const selector of PAGINATION_SELECTORS) {
      root.querySelectorAll(selector).forEach((element) => {
        if (!(element instanceof HTMLElement)) {
          return;
        }
        collectPaginationLinks(element, currentPath, paginationLinks);
      });
    }
    // Merge pagination links into main link map with special region
    paginationLinks.forEach((link) => {
      const key = `${link.href}::${link.label.toLowerCase()}`;
      if (!linkMap.has(key)) {
        linkMap.set(key, { ...link, region: 'footer' }); // Pagination treated as footer-level nav
      }
    });
  }

  // Extract tabs if enabled
  if (includeTabs) {
    for (const selector of TAB_SELECTORS) {
      root.querySelectorAll(selector).forEach((element) => {
        if (!(element instanceof HTMLElement)) {
          return;
        }
        collectTabLinks(element, currentPath, tabLinks);
      });
    }
    // Merge tab links into main link map
    tabLinks.forEach((link) => {
      const key = `${link.href}::${link.label.toLowerCase()}`;
      if (!linkMap.has(key)) {
        linkMap.set(key, { ...link, region: 'main-nav' }); // Tabs treated as main navigation
      }
    });
  }

  const toggles = collectMenuToggles(root, maxToggles);
  if (toggles.length > 0) {
    scannedRegions.add('hamburger');
  }

  const links = [...linkMap.values()]
    .sort((a, b) => {
      if (a.visible !== b.visible) {
        return a.visible ? -1 : 1;
      }
      return regionOrder(a.region) - regionOrder(b.region);
    })
    .slice(0, maxLinks);

  const summary = serializePageNavigation(
    {
      links,
      toggles,
      scannedRegions: [...scannedRegions],
      breadcrumbCount: breadcrumbLinks.length,
      paginationCount: paginationLinks.length,
      tabCount: tabLinks.length,
    },
    maxSummaryChars
  );

  return {
    links,
    toggles,
    scannedRegions: [...scannedRegions],
    summary,
  };
}

function collectLinksFromRegion(
  regionEl: Element,
  region: PageNavRegion,
  currentPath: string,
  linkMap: Map<string, PageNavigationLink>
): void {
  regionEl.querySelectorAll(LINK_SELECTORS).forEach((node) => {
    if (node instanceof HTMLElement) {
      addLink(linkMap, node, region, currentPath);
    }
  });
}

function collectBreadcrumbs(
  breadcrumbEl: HTMLElement,
  currentPath: string,
  breadcrumbLinks: PageNavigationLink[]
): void {
  const items = breadcrumbEl.querySelectorAll('li, [role="listitem"]');
  items.forEach((item) => {
    if (!(item instanceof HTMLElement)) {
      return;
    }

    const link = item.querySelector('a[href]');
    if (link instanceof HTMLElement) {
      const breadcrumbLink = createLinkFromElement(link, 'header', currentPath);
      if (breadcrumbLink) {
        breadcrumbLink.label = truncate(`📍 ${breadcrumbLink.label}`, 50); // Add breadcrumb emoji
        breadcrumbLinks.push(breadcrumbLink);
      }
    }
  });
}

function collectPaginationLinks(
  paginationEl: HTMLElement,
  currentPath: string,
  paginationLinks: PageNavigationLink[]
): void {
  paginationEl.querySelectorAll(LINK_SELECTORS).forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    const link = createLinkFromElement(node, 'footer', currentPath);
    if (link) {
      // Detect common pagination patterns
      const label = link.label.toLowerCase();
      const isPagination =
        label.match(/^(next|prev|previous|first|last|page\s?\d*|\d+|›|‹|»|«|⟩|⟨|go\s+to)$/i) ||
        node.getAttribute('aria-label')?.match(/page|next|prev|pagination/i) ||
        label.includes('next') ||
        label.includes('prev') ||
        label.includes('page');

      if (isPagination) {
        link.label = truncate(`📄 ${link.label}`, 45); // Add page emoji
        paginationLinks.push(link);
      }
    }
  });
}

function collectTabLinks(
  tabEl: HTMLElement,
  currentPath: string,
  tabLinks: PageNavigationLink[]
): void {
  // Handle tablist containers
  if (tabEl.getAttribute('role') === 'tablist') {
    const tabs = tabEl.querySelectorAll('[role="tab"], button[role="tab"]');
    tabs.forEach((tab) => {
      if (!(tab instanceof HTMLElement)) {
        return;
      }

      const label = getAccessibleName(tab);
      if (!label) {
        return;
      }

      const controls = tab.getAttribute('aria-controls');
      const selected = tab.getAttribute('aria-selected') === 'true';
      const disabled =
        tab.getAttribute('aria-disabled') === 'true' || tab.getAttribute('disabled') !== null;

      // Create a pseudo-link for tabs
      const tabLink: PageNavigationLink = {
        label: truncate(`🏷️ ${label}`, 45),
        href: controls ? `#${controls}` : '#tab',
        region: 'main-nav',
        visible: !disabled,
        current: selected,
      };

      tabLinks.push(tabLink);
    });
  } else if (tabEl.getAttribute('role') === 'tab' || tabEl.tagName === 'BUTTON') {
    // Individual tab element
    const label = getAccessibleName(tabEl);
    if (label) {
      const controls = tabEl.getAttribute('aria-controls');
      const selected = tabEl.getAttribute('aria-selected') === 'true';
      const disabled =
        tabEl.getAttribute('aria-disabled') === 'true' || tabEl.getAttribute('disabled') !== null;

      tabLinks.push({
        label: truncate(`🏷️ ${label}`, 45),
        href: controls ? `#${controls}` : '#tab',
        region: 'main-nav',
        visible: !disabled,
        current: selected,
      });
    }
  }
}

function addLink(
  linkMap: Map<string, PageNavigationLink>,
  element: HTMLElement,
  region: PageNavRegion,
  currentPath: string
): void {
  const link = createLinkFromElement(element, region, currentPath);
  if (!link) {
    return;
  }

  const key = `${link.href}::${link.label.toLowerCase()}`;
  const existing = linkMap.get(key);
  if (!existing || (!existing.visible && link.visible)) {
    linkMap.set(key, link);
  }
}

function createLinkFromElement(
  element: HTMLElement,
  region: PageNavRegion,
  currentPath: string
): PageNavigationLink | null {
  const href = resolveHref(element);
  if (!href || href.startsWith('javascript:') || href === '#') {
    return null;
  }

  const label = getAccessibleName(element);
  if (!label || label.length < 1) {
    return null;
  }

  const normalizedHref = normalizePath(href);
  const visible = isElementVisible(element);
  const inHiddenContainer = !visible || isInsideCollapsedNav(element);

  return {
    label: truncate(label, 48),
    href: normalizedHref,
    region,
    visible: visible && !inHiddenContainer,
    current: normalizedHref === currentPath,
  };
}

function collectMenuToggles(root: Element, maxToggles: number): PageNavToggle[] {
  const toggles: PageNavToggle[] = [];
  const seen = new Set<Element>();

  root.querySelectorAll(TOGGLE_SELECTORS).forEach((node) => {
    if (!(node instanceof HTMLElement) || seen.has(node)) {
      return;
    }

    const label = getAccessibleName(node);
    const ariaExpanded = node.getAttribute('aria-expanded');
    const ariaHasPopup = node.getAttribute('aria-haspopup');
    const ariaControls = node.getAttribute('aria-controls');
    const className = node.className || '';
    const isMenuControl =
      ariaHasPopup === 'menu' ||
      ariaHasPopup === 'true' ||
      ariaHasPopup === 'listbox' ||
      ariaExpanded !== null ||
      ariaControls !== null ||
      MENU_LABEL_PATTERN.test(label) ||
      MENU_LABEL_PATTERN.test(className);

    if (!isMenuControl) {
      return;
    }

    // Skip if it's a tab toggle (handled separately)
    if (node.getAttribute('role') === 'tab' || node.closest('[role="tablist"]')) {
      return;
    }

    seen.add(node);
    const region = inferToggleRegion(node);
    toggles.push({
      label: truncate(label || 'Menu', 40),
      region: region === 'unknown' ? 'hamburger' : region,
      ariaExpanded: ariaExpanded === 'true' ? true : ariaExpanded === 'false' ? false : undefined,
      controlsHiddenLinks: ariaExpanded !== 'true',
    });
  });

  return toggles.slice(0, maxToggles);
}

function inferToggleRegion(element: HTMLElement): PageNavRegion {
  if (element.closest('header, [role="banner"]')) {
    return 'header';
  }
  if (element.closest('aside, [class*="sidebar" i]')) {
    return 'sidebar';
  }
  if (element.closest('[class*="drawer" i], [role="dialog"]')) {
    return 'drawer';
  }
  return 'hamburger';
}

function getAccessibleName(element: HTMLElement): string {
  const aria = element.getAttribute('aria-label')?.trim();
  if (aria) {
    return aria;
  }

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = element.ownerDocument?.getElementById(labelledBy);
    if (labelEl?.textContent?.trim()) {
      return labelEl.textContent.trim();
    }
  }

  if (element instanceof HTMLInputElement && element.type === 'submit') {
    return element.value || '';
  }

  const title = element.getAttribute('title')?.trim();
  if (title) {
    return title;
  }

  const text = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  if (text) {
    return text;
  }

  const href = element.getAttribute('href');
  if (href && href.startsWith('/')) {
    return href;
  }

  return '';
}

function resolveHref(element: HTMLElement): string | null {
  if (element instanceof HTMLAnchorElement && element.href) {
    return element.getAttribute('href') ?? element.href;
  }

  const href = element.getAttribute('href');
  if (href) {
    return href;
  }

  const dataHref = element.getAttribute('data-href') ?? element.getAttribute('data-path');
  return dataHref;
}

function normalizePath(href: string): string {
  try {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      const url = new URL(href);
      if (typeof window !== 'undefined' && url.origin === window.location.origin) {
        return url.pathname + url.search;
      }
      return href;
    }
    if (href.startsWith('/')) {
      return href.split('#')[0];
    }
    return href;
  } catch {
    return href;
  }
}

function getLocationPath(): string {
  if (typeof window === 'undefined') {
    return '/';
  }
  return window.location.pathname + window.location.search;
}

function isElementVisible(element: HTMLElement): boolean {
  if (!element.isConnected) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isInsideCollapsedNav(element: HTMLElement): boolean {
  let current: HTMLElement | null = element.parentElement;

  while (current) {
    if (current.hasAttribute('hidden')) {
      return true;
    }

    const ariaHidden = current.getAttribute('aria-hidden');
    if (ariaHidden === 'true') {
      return true;
    }

    const style = window.getComputedStyle(current);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return true;
    }

    const expanded = current.getAttribute('aria-expanded');
    if (expanded === 'false' && current.querySelector('nav, [role="navigation"], a[href]')) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

function regionOrder(region: PageNavRegion): number {
  const order: Record<PageNavRegion, number> = {
    'main-nav': 0,
    header: 1,
    sidebar: 2,
    drawer: 3,
    hamburger: 4,
    footer: 5,
    unknown: 6,
  };
  return order[region] ?? 9;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function emptySnapshot(): PageNavigationSnapshot {
  return { links: [], toggles: [], scannedRegions: [], summary: '' };
}

export function serializePageNavigation(
  data: Pick<PageNavigationSnapshot, 'links' | 'toggles' | 'scannedRegions'> & {
    breadcrumbCount?: number;
    paginationCount?: number;
    tabCount?: number;
  },
  maxChars = 2400
): string {
  if (data.links.length === 0 && data.toggles.length === 0) {
    return '';
  }

  const lines: string[] = [];

  // Add metadata header
  const metadata: string[] = [];
  if (data.breadcrumbCount && data.breadcrumbCount > 0) {
    metadata.push(`${data.breadcrumbCount} breadcrumbs`);
  }
  if (data.tabCount && data.tabCount > 0) {
    metadata.push(`${data.tabCount} tabs`);
  }
  if (data.paginationCount && data.paginationCount > 0) {
    metadata.push(`${data.paginationCount} pagination links`);
  }
  if (metadata.length > 0) {
    lines.push(`Navigation: ${metadata.join(', ')}`);
  }

  // Add toggles first (they reveal hidden content)
  for (const toggle of data.toggles) {
    const expanded =
      toggle.ariaExpanded === true ? 'open' : toggle.ariaExpanded === false ? 'closed' : 'unknown';
    const hint = toggle.controlsHiddenLinks ? ' — may reveal hidden links' : '';
    lines.push(`• [toggle|${toggle.region}] "${toggle.label}" (${expanded})${hint}`);
  }

  // Group links by region for better readability
  const groupedLinks = new Map<PageNavRegion, PageNavigationLink[]>();
  for (const link of data.links) {
    const regionLinks = groupedLinks.get(link.region) || [];
    regionLinks.push(link);
    groupedLinks.set(link.region, regionLinks);
  }

  // Output links by region priority
  const regionPriority = [
    'header',
    'main-nav',
    'sidebar',
    'hamburger',
    'drawer',
    'footer',
    'unknown',
  ] as PageNavRegion[];
  for (const region of regionPriority) {
    const links = groupedLinks.get(region);
    if (!links || links.length === 0) {
      continue;
    }

    // Add region header if we have multiple regions
    if (Array.from(groupedLinks.keys()).length > 1) {
      lines.push(`\n${region.toUpperCase()}:`);
    }

    for (const link of links) {
      const hidden = link.visible ? '' : '|hidden';
      const current = link.current ? ' *current*' : '';
      lines.push(`  • [${link.region}${hidden}] ${link.label} → ${link.href}${current}`);
    }
  }

  let text = lines.join('\n');
  if (text.length > maxChars) {
    const kept: string[] = [];
    let len = 0;
    for (const line of lines) {
      if (len + line.length + 1 > maxChars - 24) {
        break;
      }
      kept.push(line);
      len += line.length + 1;
    }
    const omitted = lines.length - kept.length;
    if (omitted > 0) {
      kept.push(`\n… (${omitted} more nav items omitted)`);
    }
    text = kept.join('\n');
  }

  return text;
}
