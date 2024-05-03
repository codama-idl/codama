import { expect, test } from 'vitest';

import { ImportMap } from '../src';

test('it renders JavaScript import statements', () => {
    // Given an import map with 3 imports from 2 sources.
    const importMap = new ImportMap()
        .add('@metaplex-foundation/umi', ['PublicKey', 'publicKey'])
        .add('@metaplex-foundation/mpl-token-metadata', 'Metadata');

    // When we render it.
    const importStatements = importMap.toString({});

    // Then we expect the following import statements.
    expect(importStatements).toBe(
        "import { Metadata } from '@metaplex-foundation/mpl-token-metadata';\n" +
            "import { PublicKey, publicKey } from '@metaplex-foundation/umi';",
    );
});

test('it renders JavaScript import aliases', () => {
    // Given an import map with an import alias.
    const importMap = new ImportMap()
        .add('@metaplex-foundation/umi', 'publicKey')
        .addAlias('@metaplex-foundation/umi', 'publicKey', 'toPublicKey');

    // When we render it.
    const importStatements = importMap.toString({});

    // Then we expect the following import statement.
    expect(importStatements).toBe("import { publicKey as toPublicKey } from '@metaplex-foundation/umi';");
});

test('it offers some default dependency mappings', () => {
    // Given an import map with some recognized dependency keys.
    const importMap = new ImportMap()
        .add('umi', ['PublicKey', 'publicKey'])
        .add('umiSerializers', 'u16')
        .add('shared', 'myHelper');

    // When we render it.
    const importStatements = importMap.toString({});

    // Then we expect the following import statements.
    expect(importStatements).toBe(
        "import { PublicKey, publicKey } from '@metaplex-foundation/umi';\n" +
            "import { u16 } from '@metaplex-foundation/umi/serializers';\n" +
            "import { myHelper } from '../shared';",
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
