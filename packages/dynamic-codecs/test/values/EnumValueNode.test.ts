import { CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND, CodamaError } from '@codama/errors';
import {
    definedTypeNode,
    enumTypeNode,
    enumValueNode,
    enumVariantTypeNode,
    fixedSizeTransformNode,
    integerTypeNode,
    integerValueNode,
    programNode,
    rootNode,
    stringTypeNode,
    stringValueNode,
    structFieldTypeNode,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
    tupleTypeNode,
    tupleValueNode,
} from '@codama/nodes';
import { LinkableDictionary, NodeStack, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

function getVisitorForEnum(type: ReturnType<typeof enumTypeNode>, identifier: string) {
    const definedType = definedTypeNode({ identifier, type });
    const root = rootNode(programNode({ definedTypes: [definedType], identifier: 'myProgram', publicKey: '1111' }));
    const linkables = new LinkableDictionary();
    linkables.recordPath([root, root.program, definedType]);
    return getValueNodeVisitor(linkables, { stack: new NodeStack([root, root.program]) });
}

test('it returns scalar enum values as discriminated unions', () => {
    // Given a value visitor under a program with a scalar enum.
    const visitor = getVisitorForEnum(
        enumTypeNode([
            enumVariantTypeNode('up'),
            enumVariantTypeNode('right'),
            enumVariantTypeNode('down'),
            enumVariantTypeNode('left'),
        ]),
        'direction',
    );

    // When we visit enum value nodes for this enum type.
    const resultUp = visit(enumValueNode('direction', 'up'), visitor);
    const resultLeft = visit(enumValueNode('direction', 'left'), visitor);

    // Then we expect the values to be resolved from the linked type as discriminated unions.
    expect(resultUp).toStrictEqual({ __discriminator: 0, __kind: 'up' });
    expect(resultLeft).toStrictEqual({ __discriminator: 3, __kind: 'left' });
});

test('it returns data enum values with their data', () => {
    // Given a value visitor under a program with a data enum.
    const visitor = getVisitorForEnum(
        enumTypeNode([
            enumVariantTypeNode('quit'),
            enumVariantTypeNode('write', {
                data: tupleTypeNode([stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(5)] })]),
            }),
            enumVariantTypeNode('move', {
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u8') }),
                    structFieldTypeNode({ identifier: 'y', type: integerTypeNode('u8') }),
                ]),
                discriminator: 5,
            }),
        ]),
        'action',
    );

    // When we visit enum value nodes for this enum type.
    const resultQuit = visit(enumValueNode('action', 'quit'), visitor);
    const resultWrite = visit(
        enumValueNode('action', 'write', { value: tupleValueNode([stringValueNode('Hello')]) }),
        visitor,
    );
    const resultMove = visit(
        enumValueNode('action', 'move', {
            value: structValueNode([
                structFieldValueNode('x', integerValueNode('10')),
                structFieldValueNode('y', integerValueNode('20')),
            ]),
        }),
        visitor,
    );

    // Then we expect the data to be nested under `data`.
    expect(resultQuit).toStrictEqual({ __discriminator: 0, __kind: 'quit' });
    expect(resultWrite).toStrictEqual({ __discriminator: 1, __kind: 'write', data: ['Hello'] });
    expect(resultMove).toStrictEqual({ __discriminator: 5, __kind: 'move', data: { x: 10n, y: 20n } });
});

test('it returns enum values whose data is neither a struct nor a tuple', () => {
    // Given a value visitor under a program with an enum whose variant data is an integer.
    const visitor = getVisitorForEnum(
        enumTypeNode([enumVariantTypeNode('amount', { data: integerTypeNode('u64') })]),
        'operation',
    );

    // When we visit an enum value node with an integer payload.
    const result = visit(enumValueNode('operation', 'amount', { value: integerValueNode('42') }), visitor);

    // Then we expect the integer to be nested under `data`.
    expect(result).toStrictEqual({ __discriminator: 0, __kind: 'amount', data: 42n });
});

test('it throws when the variant does not exist', () => {
    const enumType = enumTypeNode([enumVariantTypeNode('up')]);
    const visitor = getVisitorForEnum(enumType, 'direction');
    const node = enumValueNode('direction', 'sideways');
    expect(() => visit(node, visitor)).toThrow(
        new CodamaError(CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND, {
            enum: enumType,
            enumName: node.enum.identifier,
            variant: node.variant,
        }),
    );
});
