import solanaConfig from '@solana/eslint-config-solana';
import tseslint from 'typescript-eslint';

export default tseslint.config([
    {
        ignores: ['**/dist/**', '**/e2e/**'],
    },
    {
        files: ['**/*.ts', '**/*.(c|m)?js'],
        extends: [solanaConfig],
    },
    {
        files: ['packages/cli/**', 'packages/nodes/**', 'packages/node-types/**'],
        rules: {
            'sort-keys-fix/sort-keys-fix': 'off',
            'typescript-sort-keys/interface': 'off',
        },
    },
]);
