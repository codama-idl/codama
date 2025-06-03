import {
    accountNode,
    booleanTypeNode,
    constantDiscriminatorNode,
    constantValueNodeFromBytes,
    definedTypeLinkNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumTypeNode,
    enumValueNode,
    fieldDiscriminatorNode,
    numberTypeNode,
    numberValueNode,
    programNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains } from './_setup';
/*
test('it renders PDA helpers for PDA with no seeds', async () => {
    // Given the following program with 1 account and 1 pda with empty seeds.
    const node = programNode({
        accounts: [accountNode({ name: 'foo', pda: pdaLinkNode('bar') })],
        name: 'myProgram',
        pdas: [pdaNode({ name: 'bar', seeds: [] })],
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following fetch helper functions delegating to findBarPda.
    await renderMapContains(renderMap, 'accounts/foo.ts', [
        'export async function fetchFooFromSeeds',
        'export async function fetchMaybeFooFromSeeds',
        'await findBarPda({ programAddress })',
    ]);
});*/

test('it renders an account with a defined type link as discriminator', async () => {
    // Given the following program with 1 account with a discriminator.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: enumValueNode('key', 'Asset'),
                        defaultValueStrategy: 'omitted',
                        name: 'key',
                        type: definedTypeLinkNode('Key'),
                    }),
                    structFieldTypeNode({
                        name: 'mutable',
                        type: booleanTypeNode(),
                    }),
                    structFieldTypeNode({
                        name: 'owner',
                        type: publicKeyTypeNode(),
                    }),
                ]),
                discriminators: [fieldDiscriminatorNode('key', 0)],
                name: 'asset',
            }),
        ],
        definedTypes: [
            definedTypeNode({
                name: 'key',
                type: enumTypeNode([enumEmptyVariantTypeNode('Uninitialized'), enumEmptyVariantTypeNode('Asset')]),
            }),
        ],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    const renderMap = visit(node, getRenderMapVisitor());
    console.log(renderMap.get('accounts/asset.py'));

    // Then we expect the following import list with a reference to the disciminator type.
    await renderMapContains(renderMap, 'accounts/asset.py', [
        'from ..program_id import PROGRAM_ID',
        `from .. import types`,
        `key: types.key.KeyJSON`,
    ]);
});

test('it renders constants for account field discriminators', async () => {
    // Given the following account with a field discriminator.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: numberValueNode(42),
                        defaultValueStrategy: 'omitted',
                        name: 'myDiscriminator',
                        type: numberTypeNode('u64'),
                    }),
                ]),
                discriminators: [fieldDiscriminatorNode('myDiscriminator')],
                name: 'myAccount',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());
    console.log(renderMap.get('accounts/myAccount.py'));

    // Then we expect the following constant and function to be rendered
    // And we expect the field default value to use that constant.

    await renderMapContains(renderMap, 'accounts/myAccount.py', [
        'discriminator: typing.ClassVar = b"\\x2a\\x00\\x00\\x00\\x00\\x00\\x00\\x00"',
    ]);
});

test('it renders constants for account constant discriminators', async () => {
    const node = programNode({
        accounts: [
            accountNode({
                discriminators: [constantDiscriminatorNode(constantValueNodeFromBytes('base16', '66d205dc9a366217'))],
                name: 'myAccount',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following constants and functions to be rendered.
    await renderMapContains(renderMap, 'accounts/myAccount.py', [
        'layout: typing.ClassVar = borsh.CStruct(',
        'discriminator: typing.ClassVar',
        '\\x66\\xd2\\x05\\xdc\\x9a\\x36\\x62\\x17',
    ]);
});

test('it renders u32 for account field discriminators', async () => {
    // Given the following account.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([structFieldTypeNode({ name: 'value', type: numberTypeNode('u32') })]),
                name: 'counter',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it using the following custom account data options.
    const renderMap = visit(node, getRenderMapVisitor({}));

    await renderMapContains(renderMap, 'accounts/counter.py', ['"value" /borsh.U32,', 'value: int']);
});
