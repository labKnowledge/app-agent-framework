/**
 * Response normalization and auto-fixing for LLM responses
 *
 * Handles various LLM output formats and provides robust fallback strategies
 * Inspired by @rnd/page-agent response normalization patterns
 */

import type { AgentAction, AgentReasoning } from '@gakwaya/app-agent-entities';

/**
 * Normalization result
 */
export interface NormalizationResult {
  success: boolean;
  reasoning?: AgentReasoning;
  error?: string;
  fixes?: string[];
}

/**
 * Normalize and parse LLM response with auto-fixing
 *
 * Handles:
 * - Markdown code blocks
 * - Double-stringified JSON
 * - Missing reflection fields (provides defaults)
 * - Action format variations
 * - Nested/wrapped structures
 */
export function normalizeLLMResponse(content: string): NormalizationResult {
  const fixes: string[] = [];

  try {
    // Step 1: Extract JSON from content
    let jsonContent = extractJSON(content);
    if (!jsonContent) {
      return {
        success: false,
        error: 'No valid JSON found in response',
        fixes
      };
    }

    // Step 2: Parse JSON with double-stringification handling
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (firstError) {
      // Try double-stringified JSON
      try {
        parsed = JSON.parse(JSON.parse(jsonContent));
        fixes.push('Fixed double-stringified JSON');
      } catch {
        const errorMessage = firstError instanceof Error ? firstError.message : String(firstError);
        return {
          success: false,
          error: `Invalid JSON: ${errorMessage}`,
          fixes
        };
      }
    }

    // Step 3: Ensure reflection fields exist (provide defaults if missing)
    if (!parsed.evaluation_previous_goal || typeof parsed.evaluation_previous_goal !== 'string') {
      parsed.evaluation_previous_goal = 'Previous step evaluation not provided';
      fixes.push('Added missing evaluation_previous_goal');
    }

    if (!parsed.memory || typeof parsed.memory !== 'string') {
      parsed.memory = 'No specific memory provided';
      fixes.push('Added missing memory');
    }

    if (!parsed.next_goal || typeof parsed.next_goal !== 'string') {
      parsed.next_goal = 'Continue with task execution';
      fixes.push('Added missing next_goal');
    }

    // Step 4: Ensure action field exists
    if (!parsed.action) {
      // Try to find action in alternative locations
      if (parsed.tool_name || parsed.action_name) {
        const toolName = parsed.tool_name || parsed.action_name;
        const params = parsed.parameters || parsed.params || {};
        parsed.action = { [toolName]: params };
        fixes.push('Converted tool_name/parameters to action format');
      } else {
        // Default action
        parsed.action = { wait: { duration: 1000 } };
        fixes.push('Added default wait action (no action found)');
      }
    }

    // Step 5: Validate reflection fields are strings
    if (typeof parsed.evaluation_previous_goal !== 'string') {
      parsed.evaluation_previous_goal = String(parsed.evaluation_previous_goal);
      fixes.push('Converted evaluation_previous_goal to string');
    }

    if (typeof parsed.memory !== 'string') {
      parsed.memory = String(parsed.memory);
      fixes.push('Converted memory to string');
    }

    if (typeof parsed.next_goal !== 'string') {
      parsed.next_goal = String(parsed.next_goal);
      fixes.push('Converted next_goal to string');
    }

    return {
      success: true,
      reasoning: {
        evaluationPreviousGoal: parsed.evaluation_previous_goal,
        memory: parsed.memory,
        nextGoal: parsed.next_goal,
        action: parsed.action as AgentAction
      },
      fixes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during normalization',
      fixes
    };
  }
}

/**
 * Extract JSON from content with multiple fallback strategies
 */
function extractJSON(content: string): string | null {
  const trimmed = content.trim();

  // Strategy 1: Remove markdown code fences
  const fencedMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  // Strategy 2: Find JSON object boundaries
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }

  // Strategy 3: Try entire content
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // Not valid JSON
  }

  return null;
}

/**
 * Validate reflection quality and provide feedback
 */
export function validateReflectionQuality(reasoning: AgentReasoning): {
  valid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check evaluation quality
  if (reasoning.evaluationPreviousGoal.length < 10) {
    issues.push('evaluation_previous_goal is too brief');
    suggestions.push('Provide detailed analysis: what succeeded, what failed, what was uncertain');
  }

  if (!/success|fail|uncertain|error|complete/i.test(reasoning.evaluationPreviousGoal)) {
    suggestions.push('Include clear verdict: Success, Failure, or Uncertain');
  }

  // Check memory quality
  if (reasoning.memory.length < 15) {
    issues.push('memory field is too brief');
    suggestions.push('Include specific observations, counts, and context for future steps');
  }

  // Check next goal quality
  if (reasoning.nextGoal.length < 10) {
    issues.push('next_goal is too vague');
    suggestions.push('Be specific: what exact action and what expected outcome');
  }

  if (!/\b(click|navigate|input|select|scroll|wait|done|execute)\b/i.test(reasoning.nextGoal)) {
    suggestions.push('Consider mentioning the specific action in next_goal');
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * Format reflection for display in history/events
 */
export function formatReflectionForHistory(reasoning: AgentReasoning): string {
  return `Evaluation: ${reasoning.evaluationPreviousGoal}
Memory: ${reasoning.memory}
Next Goal: ${reasoning.nextGoal}`;
}