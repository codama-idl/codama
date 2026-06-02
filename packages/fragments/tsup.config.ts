import { defineConfig, Options as TsupConfig } from 'tsup';

import { getPackageBuildConfigs } from '../../tsup.config.base';

// `getPackageBuildConfigs()` produces five build variants (CJS/ESM × Node/Browser
// + ESM React-Native), each using a single `./src/index.ts` entry. This package
// also exposes `./javascript` and `./rust` subpaths, so we override `entry`
// on every variant to emit one output per subpath. We also disable code
// splitting on the ESM builds so each entry is fully inlined and the
// published `files` field doesn't have to chase per-build chunk filenames.
const ENTRY: Record<string, string> = {
    index: './src/index.ts',
    javascript: './src/javascript/index.ts',
    rust: './src/rust/index.ts',
};

function withMultipleEntries(config: TsupConfig): TsupConfig {
    return { ...config, entry: ENTRY, splitting: false };
}

export default defineConfig(getPackageBuildConfigs().map(withMultipleEntries));
