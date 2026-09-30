import { CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED, CodamaError } from '@codama/errors';
import {
    constantValueNode,
    definedTypeLinkNode,
    definedTypeNode,
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

test('it delegates to the underlying type node', () => {
    const codec = getNodeValueCodec([definedTypeNode({ identifier: 'foo', type: integerTypeNode('u32') })]);
    expect(codec.encode(42)).toStrictEqual(hex('2a000000'));
    expect(codec.decode(hex('2a000000'))).toBe(42n);
});

test('it ignores injected default values when the type stands on its own', () => {
    // Given a defined type whose field defaults to an injected value that nothing provides.
    const definedType = definedTypeNode({
        identifier: 'transfer',
        type: structTypeNode([
            structFieldTypeNode({
                defaultValue: injectedValueNode({ key: 'decimals' }),
                identifier: 'decimals',
                type: integerTypeNode('u8'),
            }),
        ]),
    });

    // Then its codec can still be created, since default values are not part of the bytes.
    const codec = getNodeValueCodec([definedType]);
    expect(codec.encode({ decimals: 6 })).toStrictEqual(hex('06'));
});

test('it throws when the bytes of a standalone type depend on an injected value', () => {
    // Given a defined type whose hidden prefix injects a value that nothing provides.
    const tag = injectedValueNode({ key: 'tag' });
    const definedType = definedTypeNode({
        identifier: 'tagged',
        type: integerTypeNode('u16', {
            transforms: [hiddenPrefixTransformNode([constantValueNode(integerTypeNode('u8'), tag)])],
        }),
    });

    // Then creating its codec throws.
    expect(() => getNodeValueCodec([definedType])).toThrow(
        new CodamaError(CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED, { injectedValue: tag, key: tag.key }),
    );
});

test('it resolves injected values from the instruction using the type', () => {
    // Given the same defined type, linked from an instruction that provides the value.
    const definedType = definedTypeNode({
        identifier: 'tagged',
        type: integerTypeNode('u16', {
            transforms: [
                hiddenPrefixTransformNode([
                    constantValueNode(integerTypeNode('u8'), injectedValueNode({ key: 'tag' })),
                ]),
            ],
        }),
    });
    const instruction = instructionNode({
        data: definedTypeLinkNode('tagged'),
        identifier: 'myInstruction',
        provides: [providedNode('tag', integerValueNode('7'))],
    });
    const root = rootNode(
        programNode({
            definedTypes: [definedType],
            identifier: 'myProgram',
            instructions: [instruction],
            publicKey: '1111',
        }),
    );

    // Then the instruction's codec resolves the injection.
    const codec = getNodeValueCodec([root, root.program, instruction]);
    expect(codec.encode(42)).toStrictEqual(hex('072a00'));
    expect(codec.decode(hex('072a00'))).toBe(42n);
});

test('it only resolves injected default values when they are needed', () => {
    // Given a standalone defined type whose field defaults to an injected value that nothing provides.
    const decimals = injectedValueNode({ key: 'decimals' });
    const definedType = definedTypeNode({
        identifier: 'mint',
        type: structTypeNode([
            structFieldTypeNode({ defaultValue: decimals, identifier: 'decimals', type: integerTypeNode('u8') }),
        ]),
    });
    const codec = getNodeValueCodec([definedType]);

    // Then encoding only throws when the default value is needed.
    expect(codec.encode({ decimals: 6 })).toStrictEqual(hex('06'));
    expect(() => codec.encode({})).toThrow(
        new CodamaError(CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED, { injectedValue: decimals, key: decimals.key }),
    );
});

test('it resolves injected default values from the instruction using the type', () => {
    // Given a defined type whose field defaults to an injected value, used by an instruction providing it.
    const definedType = definedTypeNode({
        identifier: 'mint',
        type: structTypeNode([
            structFieldTypeNode({
                defaultValue: injectedValueNode({ key: 'decimals' }),
                identifier: 'decimals',
                type: integerTypeNode('u8'),
            }),
        ]),
    });
    const instruction = instructionNode({
        data: definedTypeLinkNode('mint'),
        identifier: 'initialize',
        provides: [providedNode('decimals', integerValueNode('9'))],
    });
    const root = rootNode(
        programNode({
            definedTypes: [definedType],
            identifier: 'myProgram',
            instructions: [instruction],
            publicKey: '1111',
        }),
    );

    // Then the provided value is used when the field is missing.
    const codec = getNodeValueCodec([root, root.program, instruction]);
    expect(codec.encode({})).toStrictEqual(hex('09'));
});
