import { defineConfig } from 'tsup';

import { getTestsBuildConfig } from './getBuildConfig';

export default defineConfig(getTestsBuildConfig({ format: 'esm', platform: 'node' }));
