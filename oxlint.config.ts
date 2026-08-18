const oxlint = require('oxlint');
const solanaConfig = require('@solana-config/oxc/oxlint');

// Keep in sync with oxfmt.config.ts.
const ignorePatterns = [
    '**/dist/',
    '**/generated/',
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

module.exports = oxlint.defineConfig({
    extends: [solanaConfig],
    ignorePatterns,
    options: { typeAware: true },
    overrides: [
        // These packages define large, deliberately ordered node structures.
        {
            files: ['packages/cli/**', 'packages/node-types/**', 'packages/nodes/**'],
            rules: { 'sort-keys': 'off' },
        },
    ],
});
