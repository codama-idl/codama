const oxfmt = require('oxfmt');
const solanaFmt = require('@solana-config/oxc/oxfmt');

// Keep in sync with oxlint.config.ts.
const ignorePatterns = [
    '**/dist/',
    '**/target/',
    '**/test-ledger/',
    '**/idls/',
    '.changeset/**',
    '**/CHANGELOG.md',
    'pnpm-*.yaml',
    // The anchor test fixture is a Rust project whose files are hash-pinned
    // build inputs of the committed program dumps.
    '**/*.toml',
    '**/Cargo.lock',
];

module.exports = oxfmt.defineConfig({
    ...solanaFmt,
    ignorePatterns,
});
