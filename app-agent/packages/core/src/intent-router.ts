/**
 * Intent routing — match tasks to workflows or application tools before ReAct/DOM loop.
 */

export interface WorkflowCandidate {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
}

export interface WorkflowMatch {
  workflowId: string;
  score: number;
}

export interface CustomToolCandidate {
  name: string;
  description?: string;
}

const STOP_WORDS = new Set(['the', 'a', 'an', 'to', 'for', 'all', 'my', 'please', 'can', 'you']);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function scoreOverlap(taskTokens: string[], corpus: string): number {
  if (taskTokens.length === 0) {
    return 0;
  }
  const hits = taskTokens.filter((token) => corpus.includes(token)).length;
  return hits / taskTokens.length;
}

/**
 * Match a user task to a registered workflow by keyword overlap.
 */
export function matchWorkflow(
  task: string,
  workflows: WorkflowCandidate[],
  threshold = 0.45
): WorkflowMatch | null {
  const taskTokens = tokenize(task);
  const normalizedTask = task.toLowerCase();

  let best: WorkflowMatch | null = null;

  for (const workflow of workflows) {
    const name = workflow.name.toLowerCase();
    const corpus = [
      workflow.name,
      workflow.description ?? '',
      workflow.id,
      ...(workflow.tags ?? []),
    ]
      .join(' ')
      .toLowerCase();

    let score = scoreOverlap(taskTokens, corpus);

    if (
      normalizedTask.includes(name) ||
      name.split(/\s+/).every((part) => normalizedTask.includes(part))
    ) {
      score = Math.max(score, 1);
    }

    if (score >= threshold && (!best || score > best.score)) {
      best = { workflowId: workflow.id, score };
    }
  }

  return best;
}

function humanizeToolName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase();
}

/**
 * Match a user task to a custom application tool name.
 */
export function matchCustomTool(
  task: string,
  tools: CustomToolCandidate[],
  threshold = 0.5
): string | null {
  const taskTokens = tokenize(task);
  const normalizedTask = task.toLowerCase();

  let bestName: string | null = null;
  let bestScore = threshold;

  for (const tool of tools) {
    const humanName = humanizeToolName(tool.name);
    const corpus = [tool.name, humanName, tool.description ?? ''].join(' ').toLowerCase();
    let score = scoreOverlap(taskTokens, corpus);

    if (
      normalizedTask.includes(humanName) ||
      normalizedTask.includes(tool.name.toLowerCase()) ||
      humanName
        .split(/\s+/)
        .filter(Boolean)
        .every((part) => normalizedTask.includes(part))
    ) {
      score = Math.max(score, 0.85);
    }

    if (score > bestScore) {
      bestScore = score;
      bestName = tool.name;
    }
  }

  return bestName;
}
