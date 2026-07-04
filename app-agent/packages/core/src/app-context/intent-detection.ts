/**
 * Intent detection — informational questions vs explicit navigation requests
 */

const INFORMATIONAL_PATTERNS = [
  /^\s*(what|how|why|when|who|which|where)\b/i,
  /^\s*(can you|could you|would you|please tell me|tell me|explain|describe|list)\b/i,
  /^\s*(how many|how much|is there|are there|do i have|does my|what's|what is|what are)\b/i,
  /\?\s*$/,
];

const EXPLICIT_NAV_PATTERNS = [
  /\b(go to|open|navigate to|navigate|take me to|bring me to|visit|switch to|head to)\b/i,
  /\bshow me the\b/i,
];

export function isExplicitNavigationTask(task: string): boolean {
  const trimmed = task.trim();
  return EXPLICIT_NAV_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function isInformationalTask(task: string): boolean {
  const trimmed = task.trim();
  if (isExplicitNavigationTask(trimmed)) {
    return false;
  }
  return INFORMATIONAL_PATTERNS.some((pattern) => pattern.test(trimmed));
}
