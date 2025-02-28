import { expect, test } from 'vitest';

import { ImportMap } from '../src';

test('it renders JavaScript import statements', () => {
    // Given an import map with 3 imports from 2 sources.
    const importMap = new ImportMap()
        .add('@solana/addresses', ['getAddressEncoder', 'type Address'])
        .add('@solana/instructions', 'type IInstructionWithData');

    // When we render it.
    const importStatements = importMap.toString();

    // Then we expect the following import statements.
    expect(importStatements).toBe(
        "import { getAddressEncoder, type Address } from '@solana/addresses';\n" +
            "import { type IInstructionWithData } from '@solana/instructions';",
    );
});

test('it renders JavaScript import aliases', () => {
    // Given an import map with an import alias.
    const importMap = new ImportMap()
        .add('@solana/addresses', 'type Address')
        .addAlias('@solana/addresses', 'type Address', 'SolanaAddress');

    // When we render it.
    const importStatements = importMap.toString();

    // Then we expect the following import statement.
    expect(importStatements).toBe("import { type Address as SolanaAddress } from '@solana/addresses';");
});

test('it offers some default dependency mappings', () => {
    // Given an import map with some recognized dependency keys.
    const importMap = new ImportMap()
        .add('solanaAddresses', 'type Address')
        .add('solanaCodecsCore', 'type Codec')
        .add('generatedTypes', 'type MyType')
        .add('shared', 'myHelper')
        .add('hooked', 'type MyCustomType');

    // When we render it.
    const importStatements = importMap.toString();

    // Then we expect the following import statements.
    expect(importStatements).toBe(
        "import { type Address, type Codec } from '@solana/kit';\n" +
            "import { type MyCustomType } from '../../hooked';\n" +
            "import { myHelper } from '../shared';\n" +
            "import { type MyType } from '../types';",
    );
});

test('it offers some more granular default dependency mappings', () => {
    // Given an import map with some recognized dependency keys.
    const importMap = new ImportMap()
        .add('solanaAddresses', 'type Address')
        .add('solanaCodecsCore', 'type Codec')
        .add('generatedTypes', 'type MyType')
        .add('shared', 'myHelper')
        .add('hooked', 'type MyCustomType');

    // When we render it.
    const importStatements = importMap.toString({}, true);

    // Then we expect the following import statements.
    expect(importStatements).toBe(
        "import { type Address } from '@solana/addresses';\n" +
            "import { type Codec } from '@solana/codecs';\n" +
            "import { type MyCustomType } from '../../hooked';\n" +
            "import { myHelper } from '../shared';\n" +
            "import { type MyType } from '../types';",
    );
});

test('it supports custom dependency mappings', () => {
    // Given an import map with some custom dependency keys.
    const importMap = new ImportMap().add('myDependency', 'type MyType');

    // When we render it whilst providing custom dependency mappings.
    const importStatements = importMap.toString({
        myDependency: 'my/custom/path',
    });

    // Then we expect the following import statement.
    expect(importStatements).toBe("import { type MyType } from 'my/custom/path';");
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
