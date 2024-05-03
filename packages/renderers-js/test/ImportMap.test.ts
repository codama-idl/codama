import { expect, test } from 'vitest';

import { ImportMap } from '../src';

test('it renders JavaScript import statements', () => {
    // Given an import map with 3 imports from 2 sources.
    const importMap = new ImportMap()
        .add('@solana/addresses', ['getAddressEncoder', 'Address'])
        .add('@solana/instructions', 'IInstructionWithData');

    // When we render it.
    const importStatements = importMap.toString();

    // Then we expect the following import statements.
    expect(importStatements).toBe(
        "import { Address, getAddressEncoder } from '@solana/addresses';\n" +
            "import { IInstructionWithData } from '@solana/instructions';",
    );
});

test('it renders JavaScript import aliases', () => {
    // Given an import map with an import alias.
    const importMap = new ImportMap()
        .add('@solana/addresses', 'Address')
        .addAlias('@solana/addresses', 'Address', 'SolanaAddress');

    // When we render it.
    const importStatements = importMap.toString();

    // Then we expect the following import statement.
    expect(importStatements).toBe("import { Address as SolanaAddress } from '@solana/addresses';");
});

test('it offers some default dependency mappings', () => {
    // Given an import map with some recognized dependency keys.
    const importMap = new ImportMap()
        .add('solanaAddresses', 'Address')
        .add('solanaCodecsCore', 'Codec')
        .add('generatedTypes', 'MyType')
        .add('shared', 'myHelper')
        .add('hooked', 'MyCustomType');

    // When we render it.
    const importStatements = importMap.toString();

    // Then we expect the following import statements.
    expect(importStatements).toBe(
        "import { Address, Codec } from '@solana/web3.js';\n" +
            "import { MyCustomType } from '../../hooked';\n" +
            "import { myHelper } from '../shared';\n" +
            "import { MyType } from '../types';",
    );
});

test('it offers some more granular default dependency mappings', () => {
    // Given an import map with some recognized dependency keys.
    const importMap = new ImportMap()
        .add('solanaAddresses', 'Address')
        .add('solanaCodecsCore', 'Codec')
        .add('generatedTypes', 'MyType')
        .add('shared', 'myHelper')
        .add('hooked', 'MyCustomType');

    // When we render it.
    const importStatements = importMap.toString({}, true);

    // Then we expect the following import statements.
    expect(importStatements).toBe(
        "import { Address } from '@solana/addresses';\n" +
            "import { Codec } from '@solana/codecs';\n" +
            "import { MyCustomType } from '../../hooked';\n" +
            "import { myHelper } from '../shared';\n" +
            "import { MyType } from '../types';",
    );
});

test('it supports custom dependency mappings', () => {
    // Given an import map with some custom dependency keys.
    const importMap = new ImportMap().add('myDependency', 'MyType');

    // When we render it whilst providing custom dependency mappings.
    const importStatements = importMap.toString({
        myDependency: 'my/custom/path',
    });

    // Then we expect the following import statement.
    expect(importStatements).toBe("import { MyType } from 'my/custom/path';");
});

test('it does not render empty import statements', () => {
    expect(new ImportMap().toString()).toBe('');
    expect(new ImportMap().add('shared', []).toString()).toBe('');
    expect(new ImportMap().addAlias('shared', 'Foo', 'Bar').toString()).toBe('');
});

test('it merges imports that have the same aliases together', () => {
    // Given an import map with some recognized dependency keys.
    const importMap = new ImportMap().add('packageA', 'foo').add('packageB', 'bar');

    // When we render it.
    const importStatements = importMap.toString({
        packageA: '@solana/packages',
        packageB: '@solana/packages',
    });

    // Then we expect the following import statements.
    expect(importStatements).toBe("import { bar, foo } from '@solana/packages';");
});
