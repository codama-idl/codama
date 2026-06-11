import { defineConfig } from 'vitest/config';

import { getVitestConfig } from '../../vitest.config.base.mjs';

/**
 * The spec-generators package is a Node-only build tool — its tests run
 * `prettier`, `node:fs/promises`, and other Node APIs — so we register a
 * single Node-flavoured project rather than the multi-platform matrix
 * used by published packages.
 */
export default defineConfig({
    test: {
        projects: [getVitestConfig('node')],
    },
});
