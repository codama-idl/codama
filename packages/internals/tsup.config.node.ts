import { defineConfig } from 'tsup';

import { getBuildConfig } from './getBuildConfig';

export default defineConfig([
    getBuildConfig({ format: 'cjs', platform: 'node' }),
    getBuildConfig({ format: 'esm', platform: 'node' }),
]);
