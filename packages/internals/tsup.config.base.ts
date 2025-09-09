import { env } from 'node:process';

import browsersListToEsBuild from 'browserslist-to-esbuild';
import { Format, Options as TsupConfig } from 'tsup';

type Platform = 'browser' | 'node' | 'react-native';

type BuildOptions = {
    format: Format;
    platform: Platform;
};

const BROWSERSLIST_TARGETS = browsersListToEsBuild();

export function getBuildConfig(options: BuildOptions): TsupConfig {
    const { format, platform } = options;
    return {
        define: {
            __BROWSER__: `${platform === 'browser'}`,
            __ESM__: `${format === 'esm'}`,
            __NODEJS__: `${platform === 'node'}`,
            __REACTNATIVE__: `${platform === 'react-native'}`,
            __TEST__: 'false',
            __VERSION__: `"${env.npm_package_version}"`,
        },
        entry: [`./src/index.ts`],
        esbuildOptions(options, context) {
            if (context.format === 'iife') {
                options.target = BROWSERSLIST_TARGETS;
                options.minify = true;
            } else {
                options.define = {
                    ...options.define,
                    'process.env.NODE_ENV': 'process.env.NODE_ENV',
                };
            }
        },
        external: ['node:child_process', 'node:fs', 'node:path', 'node:url'],
        format,
        globalName: 'globalThis.codama',
        name: platform,
        // Inline private, non-published packages.
        // WARNING: This inlines packages recursively. Make sure these don't have deep dep trees.
        noExternal: [
            // @noble/hashes/sha256 is an ESM-only module, so we have to inline it in CJS builds.
            ...(format === 'cjs' ? ['@noble/hashes/sha256', '@noble/hashes/crypto'] : []),
        ],
        outExtension({ format }) {
            const extension =
                format === 'iife' ? `.production.min.js` : `.${platform}.${format === 'cjs' ? 'cjs' : 'mjs'}`;
            return { js: extension };
        },
        platform: platform === 'node' ? 'node' : 'browser',
        publicDir: true,
        pure: ['process'],
        sourcemap: format !== 'iife',

        // Treeshaking already happens with esbuild but tsup offers this options
        // for "better" treeshaking strategies using Rollup as an additional step.
        // The issue is Rollup now uses the deprecated "assert" import keyword by default
        // And tsup doesn't offer a way to change this behavior. Since the CLI package
        // relies on using the "with" keyword to dynamically import JSON files,
        // we can't use Rollup for treeshaking.
        treeshake: false,
    };
}
