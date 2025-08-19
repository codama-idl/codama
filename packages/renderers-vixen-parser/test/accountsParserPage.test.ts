import { accountNode, camelCase, rootNode } from '@codama/nodes';
import { getFromRenderMap } from '@codama/renderers-core';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { codeContains } from './_setup';

test('it renders accounts parsers', () => {
    // Given the following program with 1 account and 1 pda with a byte array as seeds.
    const node = rootNode({
        accounts: [
            accountNode({ name: 'mint' }),
            accountNode({ name: 'account' }),
            accountNode({ name: 'metadata' }),
            accountNode({ name: 'master_edition' }),
            accountNode({ name: 'edition' }),
        ],
        definedTypes: [],
        docs: [],
        errors: [],
        instructions: [],
        kind: 'programNode',
        name: camelCase('test'),
        origin: 'shank',
        pdas: [],
        publicKey: 'TokenzQdZyKAYHHfoc7ndTnfcGr3qCUck3x4MvRkPaAj',
        version: '0.0.0',
    });

    // When we render it.
    const renderMap = visit(
        node,
        getRenderMapVisitor({
            projectFolder: 'test',
            projectName: 'test',
        }),
    );

    // Then we expect the following identifier and reference to the byte array
    // as a parameters to be rendered.
    codeContains(getFromRenderMap(renderMap, 'src/generated_parser/accounts_parser.rs'), [
        'pub enum TestProgramState',
        'Mint(Mint)',
        'Account(Account)',
        'Metadata(Metadata)',
        'MasterEdition(MasterEdition)',
        'Edition(Edition)',
        'pub fn try_unpack(data_bytes:&[u8]) -> yellowstone_vixen_core::ParseResult<Self>',
        'impl yellowstone_vixen_core::Parser for AccountParser',
        'async fn parse',
        'fn prefilter(&self) -> yellowstone_vixen_core::Prefilter',
        'fn id(&self) -> std::borrow::Cow<str>',
        'type Input = yellowstone_vixen_core::AccountUpdate',
        'type Output = TestProgramState',
    ]);
});
