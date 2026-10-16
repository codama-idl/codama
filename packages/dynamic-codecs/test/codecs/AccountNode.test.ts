import {
    accountLinkNode,
    accountNode,
    integerTypeNode,
    programNode,
    publicKeyTypeNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it delegates to the underlying data node', () => {
    const codec = getNodeValueCodec([
        accountNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'foo', type: integerTypeNode('u32') })]),
            identifier: 'myAccount',
        }),
    ]);
    expect(codec.encode({ foo: 42 })).toStrictEqual(hex('2a000000'));
    expect(codec.decode(hex('2a000000'))).toStrictEqual({ foo: 42n });
});

test('it encodes links back to the account as public keys', () => {
    // Given an account linking to its parent account of the same kind.
    const node = accountNode({
        data: structTypeNode([
            structFieldTypeNode({
                identifier: 'parent',
                type: publicKeyTypeNode({ accountLink: accountLinkNode('node') }),
            }),
        ]),
        identifier: 'node',
    });
    const root = rootNode(programNode({ accounts: [node], identifier: 'myProgram', publicKey: '1111' }));

    // Then its codec encodes the link as a public key, without reading the linked account.
    const codec = getNodeValueCodec([root, root.program, node]);
    const parent = '11111111111111111111111111111111';
    expect(codec.encode({ parent })).toStrictEqual(new Uint8Array(32));
    expect(codec.decode(new Uint8Array(32))).toStrictEqual({ parent });
});
