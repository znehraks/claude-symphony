/**
 * Model assigner — maps resolved model tiers to debate roles and stage personas.
 *
 * Each role has an "ideal" tier. If that tier is unavailable, it falls back to sonnet.
 * Output values use user-facing role names (reasoning/balanced/fast).
 */
import type { ResolvedModels } from './registry.js';
import type { ModelRole } from './registry.js';

type Tier = 'opus' | 'sonnet' | 'haiku';

/** Reverse mapping: internal tier → user-facing role name */
const TIER_TO_ROLE: Record<Tier, ModelRole> = {
  opus: 'reasoning',
  sonnet: 'balanced',
  haiku: 'fast',
};

export interface ModelAssignment {
  /** stage → role-index → user-facing role name */
  stageRoles: Record<string, Record<string, ModelRole>>;
  /** stage → default_model role name */
  stageDefaults: Record<string, ModelRole>;
  /** stage → persona role name */
  personas: Record<string, ModelRole>;
}

/**
 * Ideal tier for each (stage, role-index) combination.
 * Indices correspond to the roles array order in debate.jsonc.
 */
const ROLE_IDEAL_TIERS: Record<string, Tier[]> = {
  '01-brainstorm': ['opus', 'sonnet', 'sonnet'],        // Visionary, Skeptic, Integrator
  '02-research':   ['sonnet', 'sonnet', 'sonnet'],       // Deep Diver, Contrarian, Synthesizer
  '03-planning':   ['opus', 'opus', 'sonnet'],            // Architect, Risk Analyst, Pragmatist
  '04-ui-ux':      ['sonnet', 'sonnet', 'haiku'],         // UX Advocate, Visual Designer, Dev Liaison
  '05-task-management': ['haiku', 'haiku'],               // Decomposer, Dependency Mapper
  '06-implementation':  ['sonnet', 'opus', 'sonnet'],     // Coder, Reviewer, Tester
  '07-refactoring':     ['opus', 'sonnet', 'haiku'],      // Perf Engineer, Clean Code, Regression Guardian
  '08-qa':              ['opus', 'sonnet', 'sonnet'],      // Security Auditor, Accessibility, Edge Case
  '09-testing':         ['sonnet', 'sonnet', 'sonnet'],    // Coverage, Chaos, Integration
  '10-deployment':      ['haiku', 'sonnet'],               // Infra Engineer, Security Ops
};

/** Ideal tier for each stage's default_model and persona */
const STAGE_IDEAL_TIERS: Record<string, Tier> = {
  '01-brainstorm':      'opus',
  '02-research':        'sonnet',
  '03-planning':        'opus',
  '04-ui-ux':           'sonnet',
  '05-task-management': 'haiku',
  '06-implementation':  'sonnet',
  '07-refactoring':     'opus',
  '08-qa':              'sonnet',
  '09-testing':         'sonnet',
  '10-deployment':      'haiku',
};

/** Fallback chain: opus→sonnet, haiku→sonnet, sonnet stays sonnet */
function resolveTier(ideal: Tier, resolved: ResolvedModels): Tier {
  if (resolved.tiers[ideal]?.available) return ideal;
  // Always fall back to sonnet
  if (ideal !== 'sonnet' && resolved.tiers.sonnet?.available) return 'sonnet';
  // Last resort — sonnet (should always be available)
  return 'sonnet';
}

/**
 * Assign optimal model tiers based on resolved availability.
 * Returns user-facing role names (reasoning/balanced/fast).
 */
export function assignModelsToRoles(resolved: ResolvedModels): ModelAssignment {
  const stageRoles: Record<string, Record<string, ModelRole>> = {};
  const stageDefaults: Record<string, ModelRole> = {};
  const personas: Record<string, ModelRole> = {};

  for (const [stage, idealTiers] of Object.entries(ROLE_IDEAL_TIERS)) {
    stageRoles[stage] = {};
    for (let i = 0; i < idealTiers.length; i++) {
      stageRoles[stage][String(i)] = TIER_TO_ROLE[resolveTier(idealTiers[i]!, resolved)];
    }
  }

  for (const [stage, ideal] of Object.entries(STAGE_IDEAL_TIERS)) {
    stageDefaults[stage] = TIER_TO_ROLE[resolveTier(ideal, resolved)];
    personas[stage] = TIER_TO_ROLE[resolveTier(ideal, resolved)];
  }

  return { stageRoles, stageDefaults, personas };
}
