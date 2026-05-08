import { defineConfig } from 'tsup';

/**
 * `@codama-internal/spec-generators` is a private build-time tool, never
 * published to npm and never imported by other workspace packages at
 * runtime. We only need a single Node ESM build that the `generate`
 * script can invoke directly.
 *
 * Two entries are emitted: the orchestrator surface (`src/index.ts`) and
 * the bin script (`bin/generate.ts`). Both inline their dependencies
 * (`splitting: false`) so each entry stands on its own and the dist
 * layout remains predictable from the script that runs it.
 */
export default defineConfig({
    clean: false,
    dts: false,
    entry: {
        generate: './bin/generate.ts',
        index: './src/index.ts',
    },
    format: 'esm',
    outExtension() {
        return { js: '.mjs' };
    },
    platform: 'node',
    sourcemap: true,
    splitting: false,
    target: 'node20',
    treeshake: true,
});
