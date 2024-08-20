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
    pdaLinkNode,
    pdaNode,
    programNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains, renderMapContainsImports } from './_setup';

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
});

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

    // Then we expect the following import list with a reference to the disciminator type.
    await renderMapContains(renderMap, 'accounts/asset.ts', ['import { Key, getKeyDecoder, getKeyEncoder }']);
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

    // Then we expect the following constant and function to be rendered
    // And we expect the field default value to use that constant.
    await renderMapContains(renderMap, 'accounts/myAccount.ts', [
        'export const MY_ACCOUNT_MY_DISCRIMINATOR = 42;',
        'export function getMyAccountMyDiscriminatorBytes() { return getU64Encoder().encode(MY_ACCOUNT_MY_DISCRIMINATOR); }',
        '(value) => ({ ...value, myDiscriminator: MY_ACCOUNT_MY_DISCRIMINATOR })',
    ]);
});

test('it renders constants for account constant discriminators', async () => {
    // Given the following account with two constant discriminators.
    const node = programNode({
        accounts: [
            accountNode({
                discriminators: [
                    constantDiscriminatorNode(constantValueNodeFromBytes('base16', '1111')),
                    constantDiscriminatorNode(constantValueNodeFromBytes('base16', '2222'), 2),
                ],
                name: 'myAccount',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following constants and functions to be rendered.
    await renderMapContains(renderMap, 'accounts/myAccount.ts', [
        'export const MY_ACCOUNT_DISCRIMINATOR = new Uint8Array([ 17, 17 ]);',
        'export function getMyAccountDiscriminatorBytes() { return getBytesEncoder().encode(MY_ACCOUNT_DISCRIMINATOR); }',
        'export const MY_ACCOUNT_DISCRIMINATOR2 = new Uint8Array([ 34, 34 ]);',
        'export function getMyAccountDiscriminator2Bytes() { return getBytesEncoder().encode(MY_ACCOUNT_DISCRIMINATOR2); }',
    ]);
});

test('it can extracts account data and import it from another source', async () => {
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
    const renderMap = visit(
        node,
        getRenderMapVisitor({
            customAccountData: [
                {
                    extract: true,
                    importFrom: 'someModule',
                    name: 'counter',
                },
            ],
        }),
    );

    // Then we expect the account data to be fetched from the hooked directory (by default).
    await renderMapContainsImports(renderMap, 'accounts/counter.ts', {
        someModule: ['getCounterAccountDataDecoder', 'type CounterAccountData'],
    });

    // And we expect the existing account data to be extracted into a new type
    // so it can be imported from the hooked directory.
    await renderMapContains(renderMap, 'types/counterAccountData.ts', [
        'export type CounterAccountData',
        'export type CounterAccountDataArgs',
        'export function getCounterAccountDataEncoder',
        'export function getCounterAccountDataDecoder',
        'export function getCounterAccountDataCodec',
    ]);
});
