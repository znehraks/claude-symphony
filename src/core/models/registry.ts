/**
 * Built-in model registry — offline fallback when GitHub manifest is unreachable
 * Update these values before each npm publish to reflect the latest Claude models.
 */

// ── User-facing role names (the only allowed values in config/agent JSON) ──

/** User-facing model role names */
export type ModelRole = 'reasoning' | 'balanced' | 'fast';

/** Internal tier names consumed by the Task tool */
type ModelTierName = 'opus' | 'sonnet' | 'haiku';

/**
 * Single mapping from role → tier.
 * Change ONLY this constant to swap every model in the pipeline.
 */
export const ROLE_TO_TIER: Record<ModelRole, ModelTierName> = {
  reasoning: 'opus',
  balanced: 'sonnet',
  fast: 'haiku',
};

/** All valid values for a `model` field in user-facing config */
export const MODEL_ROLES = ['reasoning', 'balanced', 'fast', 'inherit'] as const;

/**
 * Resolve a user-facing role name to the Task tool tier.
 * Returns `undefined` for `'inherit'`, `undefined`/`null`, or unknown values.
 */
export function resolveToTier(model?: string): string | undefined {
  if (!model || model === 'inherit') return undefined;
  if (model in ROLE_TO_TIER) return ROLE_TO_TIER[model as ModelRole];
  return undefined;
}

// ── Internal model registry (tier-based, not exposed to users) ──

export interface ModelTier {
  id: string;
  available: boolean;
}

export interface ResolvedModels {
  source: 'manifest' | 'builtin';
  tiers: Record<'opus' | 'sonnet' | 'haiku', ModelTier>;
  timestamp: string;
}

export const BUILTIN_MODEL_REGISTRY: ResolvedModels = {
  source: 'builtin' as const,
  tiers: {
    opus: { id: 'claude-opus-4-5-20251101', available: true },
    sonnet: { id: 'claude-sonnet-4-20250514', available: true },
    haiku: { id: 'claude-haiku-4-20250414', available: true },
  },
  timestamp: '2025-05-01',
};
