import {
    constantValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumValueNode,
    enumVariantTypeNode,
    hiddenPrefixTransformNode,
    injectedValueNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    optionTypeNode,
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

test('it encodes enum default values using the linked enum', () => {
    // Given an instruction whose data defaults a field to a variant of a program enum.
    const state = definedTypeNode({
        identifier: 'state',
        type: enumTypeNode([enumVariantTypeNode('initialized'), enumVariantTypeNode('frozen')]),
    });
    const instruction = instructionNode({
        data: structTypeNode([
            structFieldTypeNode({
                defaultValue: enumValueNode('state', 'frozen'),
                identifier: 'state',
                type: definedTypeLinkNode('state'),
            }),
        ]),
        identifier: 'initialize',
    });
    const root = rootNode(
        programNode({ definedTypes: [state], identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }),
    );

    // Then the default is encoded when the field is missing, and can be overridden by identifier.
    const codec = getNodeValueCodec([root, root.program, instruction]);
    expect(codec.encode({})).toStrictEqual(hex('01'));
    expect(codec.encode({ state: 'initialized' })).toStrictEqual(hex('00'));
});

test('it encodes instruction data of recursive types', () => {
    // Given an instruction whose data is a linked list.
    const list = definedTypeNode({
        identifier: 'list',
        type: structTypeNode([
            structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u8') }),
            structFieldTypeNode({
                identifier: 'next',
                type: optionTypeNode(definedTypeLinkNode('list'), { prefix: integerTypeNode('u8') }),
            }),
        ]),
    });
    const instruction = instructionNode({ data: definedTypeLinkNode('list'), identifier: 'myInstruction' });
    const program = programNode({
        definedTypes: [list],
        identifier: 'myProgram',
        instructions: [instruction],
        publicKey: '1111',
    });
    const root = rootNode(program);

    // When we get its codec.
    const codec = getNodeValueCodec([root, program, instruction]);

    // Then it encodes and decodes the whole list.
    const value = { next: { __option: 'Some', value: { next: { __option: 'None' }, value: 2n } }, value: 1n };
    expect(codec.encode(value)).toStrictEqual(hex('01010200'));
    expect(codec.decode(hex('01010200'))).toStrictEqual(value);
});
