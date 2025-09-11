import { defineConfig } from 'tsup';

import { getBuildConfig, getCliBuildConfig } from '../../tsup.config.base';

export default defineConfig([
    getBuildConfig({ format: 'cjs', platform: 'node' }),
    getBuildConfig({ format: 'esm', platform: 'node' }),
    getCliBuildConfig(),
]);
