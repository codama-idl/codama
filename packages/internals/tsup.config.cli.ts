import { defineConfig } from 'tsup';

import { getBuildConfig } from './getBuildConfig';

export default defineConfig([
    {
        ...getBuildConfig({ format: 'esm', platform: 'node' }),
        entry: ['./src/cli.ts'],
        outExtension() {
            return { js: `.mjs` };
        },
    },
]);
