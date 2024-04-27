import test from 'ava';

import { ImportMap } from '../src/index.js';

test('it renders JavaScript import statements', t => {
    // Given an import map with 3 imports from 2 sources.
    const importMap = new ImportMap()
        .add('@metaplex-foundation/umi', ['PublicKey', 'publicKey'])
        .add('@metaplex-foundation/mpl-token-metadata', 'Metadata');

    // When we render it.
    const importStatements = importMap.toString({});

    // Then we expect the following import statements.
    t.is(
        importStatements,
        "import { Metadata } from '@metaplex-foundation/mpl-token-metadata';\n" +
            "import { PublicKey, publicKey } from '@metaplex-foundation/umi';",
    );
});

test('it renders JavaScript import aliases', t => {
    // Given an import map with an import alias.
    const importMap = new ImportMap()
        .add('@metaplex-foundation/umi', 'publicKey')
        .addAlias('@metaplex-foundation/umi', 'publicKey', 'toPublicKey');

    // When we render it.
    const importStatements = importMap.toString({});

    // Then we expect the following import statement.
    t.is(importStatements, "import { publicKey as toPublicKey } from '@metaplex-foundation/umi';");
});

test('it offers some default dependency mappings', t => {
    // Given an import map with some recognized dependency keys.
    const importMap = new ImportMap()
        .add('umi', ['PublicKey', 'publicKey'])
        .add('umiSerializers', 'u16')
        .add('shared', 'myHelper');

    // When we render it.
    const importStatements = importMap.toString({});

    // Then we expect the following import statements.
    t.is(
        importStatements,
        "import { PublicKey, publicKey } from '@metaplex-foundation/umi';\n" +
            "import { u16 } from '@metaplex-foundation/umi/serializers';\n" +
            "import { myHelper } from '../shared';",
    );
});

test('it supports custom dependency mappings', t => {
    // Given an import map with some custom dependency keys.
    const importMap = new ImportMap().add('myDependency', 'MyType');

    // When we render it whilst providing custom dependency mappings.
    const importStatements = importMap.toString({
        myDependency: 'my/custom/path',
    });

    // Then we expect the following import statement.
    t.is(importStatements, "import { MyType } from 'my/custom/path';");
});
