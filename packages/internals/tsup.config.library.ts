import { defineConfig } from 'tsup';

import { getBuildConfig, getPackageBuildConfig } from './getBuildConfig';

export default defineConfig([...getPackageBuildConfig(), getBuildConfig({ format: 'iife', platform: 'browser' })]);
