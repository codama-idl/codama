import { defineConfig } from 'tsup';

import { getTestsBuildConfig } from './getBuildConfig';

export default defineConfig([
    ...getTestsBuildConfig({ format: 'cjs', platform: 'browser' }),
    ...getTestsBuildConfig({ format: 'esm', platform: 'browser' }),
]);
