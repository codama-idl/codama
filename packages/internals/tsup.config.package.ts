import { defineConfig } from 'tsup';

import { getPackageBuildConfig } from './getBuildConfig';

export default defineConfig(getPackageBuildConfig());
