import { defineConfig } from 'vitest/config';
import { getVitestConfig } from './vitest.config.base.mjs';

/**
 * This config file is not directly used by packages scripts or CI.
 * It's only purpose is to provide IDEs with a default configuration
 * so features from Vitest extensions can work out of the box.
 *
 * Ideally, this will be used in the future once Vitest supports hierarchical subprojects.
 * @see https://github.com/vitest-dev/vitest/issues/8226
 */
export default defineConfig(getVitestConfig('node'));
