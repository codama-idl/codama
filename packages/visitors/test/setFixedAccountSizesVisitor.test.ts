import {
    accountNode,
    definedTypeLinkNode,
    definedTypeNode,
    integerTypeNode,
    programNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { setFixedAccountSizesVisitor } from '../src';

test('it sets the size of fixed-size accounts, following links', () => {
    // Given a program with a fixed-size account, a linked fixed-size account and a variable-size account.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'a', type: integerTypeNode('u64') }),
                    structFieldTypeNode({ identifier: 'b', type: integerTypeNode('u8') }),
                ]),
                identifier: 'fixed',
            }),
            accountNode({ data: definedTypeLinkNode('myType'), identifier: 'linked' }),
            accountNode({ data: stringTypeNode('utf8'), identifier: 'variable' }),
        ],
        definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u32') })],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we set fixed account sizes.
    const result = visit(node, setFixedAccountSizesVisitor());

    // Then only fixed-size accounts get a size.
    expect(result).toStrictEqual(
        programNode({
            ...node,
            accounts: [
                accountNode({ ...node.accounts![0], size: 9 }),
                accountNode({ ...node.accounts![1], size: 4 }),
                node.accounts![2],
            ],
        }),
    );
});

test('it does not override existing sizes', () => {
    // Given an account with an explicit size.
    const node = programNode({
        accounts: [accountNode({ data: integerTypeNode('u8'), identifier: 'myAccount', size: 100 })],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we set fixed account sizes, then nothing changes.
    expect(visit(node, setFixedAccountSizesVisitor())).toStrictEqual(node);
});
