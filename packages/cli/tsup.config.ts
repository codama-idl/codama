import { defineConfig, Options as TsupConfig } from 'tsup';

import { getBuildConfig, getCliBuildConfig } from '../../tsup.config.base';

export default defineConfig([
    removeAdditionalTreeShaking(getBuildConfig({ format: 'cjs', platform: 'node' })),
    removeAdditionalTreeShaking(getBuildConfig({ format: 'esm', platform: 'node' })),
    removeAdditionalTreeShaking(getCliBuildConfig()),
]);

function removeAdditionalTreeShaking(config: TsupConfig): TsupConfig {
    return {
        ...config,

        // Treeshaking already happens with esbuild but tsup offers this options
        // for "better" treeshaking strategies using Rollup as an additional step.
        // The issue is Rollup now uses the deprecated "assert" import keyword by default
        // And tsup doesn't offer a way to change this behavior. Since the CLI package
        // relies on using the "with" keyword to dynamically import JSON files,
        // we can't use Rollup for treeshaking.
        treeshake: false,
    };
}
