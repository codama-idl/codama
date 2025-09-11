import { defineConfig } from 'tsup';

import { getCliBuildConfig, getPackageBuildConfigs } from '../../tsup.config.base';

export default defineConfig([...getPackageBuildConfigs(), getCliBuildConfig()]);
