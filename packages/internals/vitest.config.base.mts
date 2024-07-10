import { env } from 'node:process';

import { configDefaults, defineConfig } from 'vitest/config';

export type Platform = 'browser' | 'node' | 'react-native';

export function getVitestConfig(platform: Platform) {
    return defineConfig({
        define: {
            __BROWSER__: `${platform === 'browser'}`,
            __ESM__: 'true',
            __NODEJS__: `${platform === 'node'}`,
            __REACTNATIVE__: `${platform === 'react-native'}`,
            __TEST__: 'true',
            __VERSION__: `"${env.npm_package_version}"`,
        },
        test: {
            environment: platform === 'browser' ? 'happy-dom' : 'node',
            exclude: [...configDefaults.exclude, '**/e2e/**'],
        },
    });
}
