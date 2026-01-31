import { defineConfig } from 'tsup';

export default defineConfig([
  // CLI entry point (with shebang)
  {
    entry: {
      'cli/index': 'src/cli/index.ts',
    },
    format: ['esm'],
    target: 'node20',
    dts: true,
    clean: true,
    sourcemap: false,
    splitting: false,
    shims: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  // Core library + hooks (no shebang)
  {
    entry: {
      'core/index': 'src/core/index.ts',
      'hooks/pre-stage': 'src/hooks/pre-stage.ts',
      'hooks/post-stage': 'src/hooks/post-stage.ts',
      'hooks/auto-checkpoint': 'src/hooks/auto-checkpoint.ts',
      'hooks/ai-selector': 'src/hooks/ai-selector.ts',
      'hooks/output-validator': 'src/hooks/output-validator.ts',
      'hooks/session-start': 'src/hooks/session-start.ts',
      'hooks/stage-checklist': 'src/hooks/stage-checklist.ts',
      'hooks/pre-transition': 'src/hooks/pre-transition.ts',
    },
    format: ['esm'],
    target: 'node20',
    dts: true,
    clean: false, // Don't clean — CLI build already ran
    sourcemap: false,
    splitting: false,
    shims: true,
  },
]);
