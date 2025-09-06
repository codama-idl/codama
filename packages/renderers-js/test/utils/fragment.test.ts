import { pipe } from '@codama/visitors-core';
import { describe, expect, test } from 'vitest';

import { addFragmentImportAlias, addFragmentImports, fragment, use } from '../../src/utils';

describe('use', () => {
    test('it creates a fragment with an import of the same name', () => {
        expect(use('address', '@solana/addresses')).toStrictEqual(
            addFragmentImports(fragment`address`, '@solana/addresses', ['address']),
        );
    });

    test('it creates a fragment with a type import', () => {
        expect(use('type Address', '@solana/addresses')).toStrictEqual(
            addFragmentImports(fragment`Address`, '@solana/addresses', ['type Address']),
        );
    });

    test('it creates a fragment with an alias', () => {
        expect(use('address as myAddress', '@solana/addresses')).toStrictEqual(
            pipe(
                fragment`myAddress`,
                f => addFragmentImports(f, '@solana/addresses', ['address']),
                f => addFragmentImportAlias(f, '@solana/addresses', 'address', 'myAddress'),
            ),
        );
    });

    test('it creates a fragment with a type alias', () => {
        expect(use('type Address as MyAddress', '@solana/addresses')).toStrictEqual(
            pipe(
                fragment`MyAddress`,
                f => addFragmentImports(f, '@solana/addresses', ['type Address']),
                f => addFragmentImportAlias(f, '@solana/addresses', 'type Address', 'type MyAddress'),
            ),
        );
    });
});
