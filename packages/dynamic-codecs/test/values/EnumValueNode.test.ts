import {
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    enumValueNode,
    fixedSizeTypeNode,
    numberTypeNode,
    numberValueNode,
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

test('it returns scalar enum values as numbers', () => {
    // Given a program with a scalar enum.
    const definedType = definedTypeNode({
        name: 'direction',
        type: enumTypeNode([
            enumEmptyVariantTypeNode('up'),
            enumEmptyVariantTypeNode('right'),
            enumEmptyVariantTypeNode('down'),
            enumEmptyVariantTypeNode('left'),
        ]),
    });
    const root = rootNode(programNode({ definedTypes: [definedType], name: 'myProgram', publicKey: '1111' }));

    // And a LinkableDictionary that recorded the enum.
    const linkables = new LinkableDictionary();
    linkables.recordPath([root, root.program, definedType]);

    // And a value node visitor that's under the same program.
    const stack = new NodeStack([root, root.program]);
    const visitor = getValueNodeVisitor(linkables, { stack });

    // When we visit enum value nodes for this enum type.
    const resultUp = visit(enumValueNode('direction', 'up'), visitor);
    const resultRight = visit(enumValueNode('direction', 'right'), visitor);
    const resultDown = visit(enumValueNode('direction', 'down'), visitor);
    const resultLeft = visit(enumValueNode('direction', 'left'), visitor);

    // Then we expect the values to be resolved from the linkable type as numbers.
    expect(resultUp).toBe(0);
    expect(resultRight).toBe(1);
    expect(resultDown).toBe(2);
    expect(resultLeft).toBe(3);
});

test('it returns data enum values as objects', () => {
    // Given a program with a data enum.
    const definedType = definedTypeNode({
        name: 'action',
        type: enumTypeNode([
            enumEmptyVariantTypeNode('quit'),
            enumTupleVariantTypeNode('write', tupleTypeNode([fixedSizeTypeNode(stringTypeNode('utf8'), 5)])),
            enumStructVariantTypeNode(
                'move',
                structTypeNode([
                    structFieldTypeNode({ name: 'x', type: numberTypeNode('u8') }),
                    structFieldTypeNode({ name: 'y', type: numberTypeNode('u8') }),
                ]),
            ),
        ]),
    });
    const root = rootNode(programNode({ definedTypes: [definedType], name: 'myProgram', publicKey: '1111' }));

    // And a LinkableDictionary that recorded the enum.
    const linkables = new LinkableDictionary();
    linkables.recordPath([root, root.program, definedType]);

    // And a value node visitor that's under the same program.
    const stack = new NodeStack([root, root.program]);
    const visitor = getValueNodeVisitor(linkables, { stack });

    // When we visit enum value nodes for this enum type.
    const resultQuit = visit(enumValueNode('action', 'quit'), visitor);
    const resultWrite = visit(enumValueNode('action', 'write', tupleValueNode([stringValueNode('Hello')])), visitor);
    const resultMove = visit(
        enumValueNode(
            'action',
            'move',
            structValueNode([
                structFieldValueNode('x', numberValueNode(10)),
                structFieldValueNode('y', numberValueNode(20)),
            ]),
        ),
        visitor,
    );

    // Then we expect the values to be resolved from the linkable type as numbers.
    expect(resultQuit).toStrictEqual({ __kind: 'Quit' });
    expect(resultWrite).toStrictEqual({ __kind: 'Write', fields: ['Hello'] });
    expect(resultMove).toStrictEqual({ __kind: 'Move', x: 10, y: 20 });
});
