import solanaConfig from '@solana/eslint-config-solana';
import tseslint from 'typescript-eslint';

export default tseslint.config([
    {
        files: ['**/*.ts'],
        extends: [solanaConfig],
        rules: {
            '@typescript-eslint/restrict-template-expressions': 'off',
        },
    },
    {
        files: ['packages/nodes/**', 'packages/node-types/**'],
        rules: {
            'sort-keys-fix/sort-keys-fix': 'off',
            'typescript-sort-keys/interface': 'off',
        },
    },
]);
