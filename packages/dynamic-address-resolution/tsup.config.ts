import { defineConfig } from 'tsup';

import { getBuildConfig, getCliBuildConfig, getPackageBuildConfigs } from '../../tsup.config.base';

const codegenConfigs = (['cjs', 'esm'] as const).map(format => ({
    ...getBuildConfig({ format, platform: 'node' }),
    entry: { codegen: './src/codegen/index.ts' },
    outExtension: () => ({ js: format === 'cjs' ? '.node.cjs' : '.node.mjs' }),
}));

export default defineConfig([...getPackageBuildConfigs(), getCliBuildConfig(), ...codegenConfigs]);
