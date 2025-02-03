import { defineConfig } from 'tsup';

import { getBuildConfig } from './tsup.config.base';

export default defineConfig([
    {
        ...getBuildConfig({ format: 'cjs', platform: 'node' }),
        entry: { cli: './src/cli/index.ts' },
        outExtension() {
            return { js: `.cjs` };
        },
    },
]);
