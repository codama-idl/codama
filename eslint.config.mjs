import solanaConfig from '@solana/eslint-config-solana';
import tseslint from 'typescript-eslint';

export default tseslint.config([
    {
        files: ['**/*.ts', '**/*.(c|m)?js'],
        extends: [solanaConfig],
    },
    {
        files: ['packages/nodes/**', 'packages/node-types/**'],
        rules: {
            'sort-keys-fix/sort-keys-fix': 'off',
            'typescript-sort-keys/interface': 'off',
        },
    },
]);
