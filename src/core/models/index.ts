/**
 * Model discovery and assignment — barrel exports
 */
export { resolveModels } from './resolver.js';
export { assignModelsToRoles } from './assigner.js';
export { BUILTIN_MODEL_REGISTRY, ROLE_TO_TIER, MODEL_ROLES, resolveToTier } from './registry.js';
export type { ResolvedModels, ModelTier, ModelRole } from './registry.js';
export type { ModelAssignment } from './assigner.js';
