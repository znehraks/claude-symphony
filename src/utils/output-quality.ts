/**
 * Output quality validation utility
 * Detects meta-commentary, prompt echo, and insufficient structural content
 * in external AI outputs.
 */

/**
 * Quality validation signals
 */
export interface QualitySignals {
  minLength: boolean;
  notMetaCommentary: boolean;
  hasStructuralContent: boolean;
  notPromptEcho: boolean;
}

/**
 * Quality validation result
 */
export interface QualityResult {
  passes: boolean;
  score: number; // 0.0 - 1.0
  reason: string;
  signals: QualitySignals;
}

export interface QualityOptions {
  minChars?: number;
  stageId?: string;
}

/**
 * Anti-patterns that indicate meta-commentary rather than actual content.
 * These match outputs like "I will generate ideas..." or "Stage 01 is complete".
 */
const META_COMMENTARY_PATTERNS: RegExp[] = [
  /^I will (generate|create|produce|write|provide|prepare|develop|design|draft)/im,
  /^I('m going to|'ll) (generate|create|produce|write|provide|prepare|develop)/im,
  /Stage \d+ .* is complete/i,
  /\*\*Outputs Generated:\*\*/,
  /Ready for Stage/i,
  /^Here('s| is) (the|a|my) (plan|outline|summary) (for|of) (what|how) I/im,
  /^Let me (start|begin) by/im,
  /^(Now|Next),? I('ll| will) (proceed|move on|continue)/im,
];

const DEFAULT_MIN_CHARS = 500;

/**
 * Validate the quality of an AI output.
 *
 * Checks:
 * 1. Minimum character length (default 500)
 * 2. Not meta-commentary (anti-pattern detection)
 * 3. Has structural content (headings or bullet points)
 * 4. Not a prompt echo (output sentences overlap >60% with prompt)
 */
export function validateOutputQuality(
  output: string,
  prompt: string,
  options?: QualityOptions
): QualityResult {
  const minChars = options?.minChars ?? DEFAULT_MIN_CHARS;

  // Signal 1: Minimum length
  const minLength = output.length >= minChars;

  // Signal 2: Meta-commentary detection
  const notMetaCommentary = !META_COMMENTARY_PATTERNS.some((p) => p.test(output));

  // Signal 3: Structural content (## headings or bullet points)
  const headingCount = (output.match(/^#{1,3}\s+\S/gm) ?? []).length;
  const bulletCount = (output.match(/^[\s]*[-*]\s+\S/gm) ?? []).length;
  const hasStructuralContent = headingCount >= 2 || bulletCount >= 5;

  // Signal 4: Prompt echo detection
  const notPromptEcho = !isPromptEcho(output, prompt);

  const signals: QualitySignals = {
    minLength,
    notMetaCommentary,
    hasStructuralContent,
    notPromptEcho,
  };

  // Score: each signal is worth 0.25
  const signalValues = [minLength, notMetaCommentary, hasStructuralContent, notPromptEcho];
  const score = signalValues.filter(Boolean).length / signalValues.length;

  // Must pass all signals to pass overall
  const passes = signalValues.every(Boolean);

  // Build reason string
  let reason = 'OK';
  if (!passes) {
    const failures: string[] = [];
    if (!minLength) failures.push(`too short (${output.length}/${minChars} chars)`);
    if (!notMetaCommentary) failures.push('meta-commentary detected');
    if (!hasStructuralContent) failures.push('lacks structural content (needs 2+ headings or 5+ bullets)');
    if (!notPromptEcho) failures.push('prompt echo detected (>60% overlap)');
    reason = failures.join('; ');
  }

  return { passes, score, reason, signals };
}

/**
 * Check if the output is mostly a re-statement of the prompt.
 * Splits output into sentences and checks if >60% appear in the prompt.
 */
function isPromptEcho(output: string, prompt: string): boolean {
  if (!prompt || prompt.length < 50) return false;

  const promptLower = prompt.toLowerCase();
  const sentences = output
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20); // Only consider non-trivial sentences

  if (sentences.length === 0) return false;

  let echoCount = 0;
  for (const sentence of sentences) {
    if (promptLower.includes(sentence.toLowerCase())) {
      echoCount++;
    }
  }

  return echoCount / sentences.length > 0.6;
}
