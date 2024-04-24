import { defineConfig } from 'tsup';

import { getTestsBuildConfig } from './getBuildConfig';

export default defineConfig([
    ...getTestsBuildConfig({ format: 'cjs', platform: 'node' }),
    ...getTestsBuildConfig({ format: 'esm', platform: 'node' }),
]);
