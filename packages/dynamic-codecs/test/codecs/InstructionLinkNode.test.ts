import { instructionLinkNode, instructionNode, integerTypeNode, programNode, rootNode } from '@codama/nodes';
import { getRecordLinkablesVisitor, LinkableDictionary, NodeStack, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getNodeValueCodecVisitor } from '../../src';
import { hex } from '../_setup';

test('it resolves the codec of instruction link nodes', () => {
    // Given an instruction and a link node pointing to it.
    const instruction = instructionNode({ data: integerTypeNode('u32'), identifier: 'transfer' });
    const root = rootNode(programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }));
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we get the codec of the link node from within the program.
    const stack = new NodeStack([root, root.program]);
    const codec = visit(instructionLinkNode('transfer'), getNodeValueCodecVisitor(linkables, { stack }));

    // Then we expect the codec of the linked instruction.
    expect(codec.encode(42)).toStrictEqual(hex('2a000000'));
    expect(codec.decode(hex('2a000000'))).toBe(42n);
});
