import {
    constantValueNode,
    hiddenPrefixTransformNode,
    injectedValueNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    programNode,
    providedNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it delegates to the instruction data', () => {
    const codec = getNodeValueCodec([
        instructionNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'foo', type: integerTypeNode('u32') })]),
            identifier: 'myInstruction',
        }),
    ]);
    expect(codec.encode({ foo: 42 })).toStrictEqual(hex('2a000000'));
    expect(codec.decode(hex('2a000000'))).toStrictEqual({ foo: 42n });
});

test('it encodes instructions without data as empty bytes', () => {
    const codec = getNodeValueCodec([instructionNode({ identifier: 'myInstruction' })]);
    expect(codec.encode(undefined)).toStrictEqual(hex(''));
    expect(codec.decode(hex(''))).toBeUndefined();
});

test('it resolves injected values from the instruction and its ancestors', () => {
    // Given a sub-instruction whose data injects values provided by itself and its parent.
    const prefix = hiddenPrefixTransformNode([
        constantValueNode(integerTypeNode('u8'), injectedValueNode({ key: 'parentTag' })),
        constantValueNode(integerTypeNode('u8'), injectedValueNode({ key: 'childTag' })),
    ]);
    const child = instructionNode({
        data: integerTypeNode('u16', { transforms: [prefix] }),
        identifier: 'child',
        provides: [providedNode('childTag', integerValueNode('2'))],
    });
    const parent = instructionNode({
        identifier: 'parent',
        provides: [providedNode('parentTag', integerValueNode('1'))],
        subInstructions: [child],
    });
    const root = rootNode(programNode({ identifier: 'myProgram', instructions: [parent], publicKey: '1111' }));

    // When we get the codec of the sub-instruction.
    const codec = getNodeValueCodec([root, root.program, parent, child]);

    // Then both injected values are resolved.
    expect(codec.encode(42)).toStrictEqual(hex('01022a00'));
    expect(codec.decode(hex('01022a00'))).toBe(42n);
});
