import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    // CLI entry point
    'cli/index': 'src/cli/index.ts',
    // Hook entry points (for shell wrapper invocation)
    'hooks/pre-stage': 'src/hooks/pre-stage.ts',
    'hooks/post-stage': 'src/hooks/post-stage.ts',
    'hooks/auto-checkpoint': 'src/hooks/auto-checkpoint.ts',
    'hooks/ai-selector': 'src/hooks/ai-selector.ts',
    'hooks/output-validator': 'src/hooks/output-validator.ts',
    'hooks/session-start': 'src/hooks/session-start.ts',
  },
  format: ['esm'],
  target: 'node20',
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
