import { defineConfig } from 'tsup';

import { getBuildConfig, getCliBuildConfig, getPackageBuildConfigs } from '../../tsup.config.base';

export default defineConfig([
    ...getPackageBuildConfigs(),
    getBuildConfig({ format: 'iife', platform: 'browser' }),
    getCliBuildConfig(),
]);
