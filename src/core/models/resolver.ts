/**
 * Model resolver with 2-tier fallback:
 * 1. GitHub manifest (public URL, no API key needed) — 3s timeout
 * 2. Built-in registry (always succeeds, offline-safe)
 */
import { BUILTIN_MODEL_REGISTRY, type ResolvedModels } from './registry.js';

const MANIFEST_URL =
  'https://raw.githubusercontent.com/znehraks/claude-symphony/main/model-manifest.json';
const FETCH_TIMEOUT_MS = 3_000;

interface ManifestPayload {
  version: number;
  lastUpdated: string;
  tiers: Record<'opus' | 'sonnet' | 'haiku', { id: string; available: boolean }>;
}

/**
 * Fetch the model manifest from GitHub with a hard timeout.
 */
async function resolveFromManifest(): Promise<ResolvedModels> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(MANIFEST_URL, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as ManifestPayload;

    // Basic validation
    if (!data.tiers?.opus || !data.tiers?.sonnet || !data.tiers?.haiku) {
      throw new Error('Invalid manifest structure');
    }

    return {
      source: 'manifest',
      tiers: data.tiers,
      timestamp: data.lastUpdated,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Return the built-in registry (always succeeds).
 */
function getBuiltinRegistry(): ResolvedModels {
  return { ...BUILTIN_MODEL_REGISTRY };
}

/**
 * Resolve available models using 2-tier fallback.
 * Manifest failure silently falls back to the built-in registry.
 */
export async function resolveModels(): Promise<ResolvedModels> {
  try {
    return await resolveFromManifest();
  } catch {
    return getBuiltinRegistry();
  }
}
