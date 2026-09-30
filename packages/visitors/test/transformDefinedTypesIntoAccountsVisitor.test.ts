import {
    accountNode,
    definedTypeNode,
    integerTypeNode,
    pluginNode,
    programNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { transformDefinedTypesIntoAccountsVisitor } from '../src';

test('it moves the given defined types into accounts', () => {
    // Given a program with two defined types.
    const data = structTypeNode([structFieldTypeNode({ identifier: 'count', type: integerTypeNode('u64') })]);
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                docs: 'A counter.',
                identifier: 'counter',
                plugins: [pluginNode('my.plugin')],
                type: data,
            }),
            definedTypeNode({ identifier: 'other', type: integerTypeNode('u8') }),
        ],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we transform one of them into an account.
    const result = visit(node, transformDefinedTypesIntoAccountsVisitor(['counter']));

    // Then it becomes an account keeping its docs and plugins.
    expect(result).toStrictEqual(
        programNode({
            accounts: [
                accountNode({ data, docs: 'A counter.', identifier: 'counter', plugins: [pluginNode('my.plugin')] }),
            ],
            definedTypes: [definedTypeNode({ identifier: 'other', type: integerTypeNode('u8') })],
            identifier: 'myProgram',
            publicKey: '1111',
        }),
    );
});

test('it accepts defined types that are not structs', () => {
    // Given a defined type that is a plain integer.
    const node = programNode({
        definedTypes: [definedTypeNode({ identifier: 'counter', type: integerTypeNode('u64') })],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we transform it into an account, then its type becomes the account's data.
    expect(visit(node, transformDefinedTypesIntoAccountsVisitor(['counter']))).toStrictEqual(
        programNode({
            accounts: [accountNode({ data: integerTypeNode('u64'), identifier: 'counter' })],
            identifier: 'myProgram',
            publicKey: '1111',
        }),
    );
});
