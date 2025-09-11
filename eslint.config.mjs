import solanaConfig from '@solana/eslint-config-solana';
import { defineConfig } from 'eslint/config';

export default defineConfig([
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
