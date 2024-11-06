import {
    definedTypeLinkNode,
    definedTypeNode,
    numberTypeNode,
    programLinkNode,
    programNode,
    rootNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it resolves the codec of defined type link nodes', () => {
    // Given an existing defined type and a LinkNode pointing to it.
    const root = rootNode(
        programNode({
            definedTypes: [
                definedTypeNode({ name: 'slot', type: numberTypeNode('u64') }),
                definedTypeNode({ name: 'lastSlot', type: definedTypeLinkNode('slot') }),
            ],
            name: 'myProgram',
            publicKey: '1111',
        }),
    );

    // When we get the codec for the defined type pointing to another defined type.
    const codec = getNodeCodec([root, root.program, root.program.definedTypes[1]]);

    // Then we expect the codec to match the linked defined type.
    expect(codec.encode(42)).toStrictEqual(hex('2a00000000000000'));
    expect(codec.decode(hex('2a00000000000000'))).toBe(42n);
});

test('it follows linked nodes using the correct paths', () => {
    // Given two link nodes designed so that the path would
    // fail if we did not save and restored linked paths.
    const programA = programNode({
        definedTypes: [
            definedTypeNode({
                name: 'typeA',
                type: definedTypeLinkNode('typeB1', programLinkNode('programB')),
            }),
        ],
        name: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        definedTypes: [
            definedTypeNode({ name: 'typeB1', type: definedTypeLinkNode('typeB2') }),
            definedTypeNode({ name: 'typeB2', type: numberTypeNode('u64') }),
        ],
        name: 'programB',
        publicKey: '2222',
    });
    const root = rootNode(programA, [programB]);

    // When we get the codec for the defined type in programA.
    const codec = getNodeCodec([root, programA, programA.definedTypes[0]]);

    // Then we expect the links in programB to be resolved correctly.
    expect(codec.encode(42)).toStrictEqual(hex('2a00000000000000'));
    expect(codec.decode(hex('2a00000000000000'))).toBe(42n);
});
