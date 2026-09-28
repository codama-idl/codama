import { accountLinkNode, accountNode, integerTypeNode, programNode, rootNode } from '@codama/nodes';
import { getRecordLinkablesVisitor, LinkableDictionary, NodeStack, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getNodeValueCodecVisitor } from '../../src';
import { hex } from '../_setup';

test('it resolves the codec of account link nodes', () => {
    // Given an account and a link node pointing to it.
    const account = accountNode({ data: integerTypeNode('u32'), identifier: 'counter' });
    const root = rootNode(programNode({ accounts: [account], identifier: 'myProgram', publicKey: '1111' }));
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we get the codec of the link node from within the program.
    const stack = new NodeStack([root, root.program]);
    const codec = visit(accountLinkNode('counter'), getNodeValueCodecVisitor(linkables, { stack }));

    // Then we expect the codec of the linked account.
    expect(codec.encode(42)).toStrictEqual(hex('2a000000'));
    expect(codec.decode(hex('2a000000'))).toBe(42n);
});
