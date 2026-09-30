import {
    addTypeNodeTransforms,
    enumTypeNode,
    enumVariantTypeNode,
    instructionStatusNode,
    integerTypeNode,
    optionTypeNode,
    publicKeyTypeNode,
    sizePrefixTransformNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    textNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getDebugStringVisitor, visit } from '../src';

const getTree = () =>
    tupleTypeNode([
        integerTypeNode('u32'),
        structTypeNode([
            structFieldTypeNode({
                identifier: 'firstname',
                type: addTypeNodeTransforms(stringTypeNode('utf8'), [sizePrefixTransformNode(integerTypeNode('u64'))]),
            }),
            structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u32') }),
            structFieldTypeNode({
                identifier: 'wallet',
                type: optionTypeNode(publicKeyTypeNode(), {
                    prefix: integerTypeNode('u16'),
                }),
            }),
            structFieldTypeNode({
                identifier: 'industry',
                type: enumTypeNode([
                    enumVariantTypeNode('programming'),
                    enumVariantTypeNode('crypto'),
                    enumVariantTypeNode('music'),
                ]),
            }),
        ]),
    ]);

test('it returns a string representing the main information of a node for debugging purposes', () => {
    // Given the following tree.
    const node = getTree();

    // When we get its debug string.
    const result = visit(node, getDebugStringVisitor());

    // Then we expect the following string.
    expect(result).toEqual(
        'tupleTypeNode(integerTypeNode[u32], structTypeNode(structFieldTypeNode[firstname](stringTypeNode[utf8](sizePrefixTransformNode(integerTypeNode[u64]))), structFieldTypeNode[age](integerTypeNode[u32]), structFieldTypeNode[wallet](optionTypeNode(integerTypeNode[u16], publicKeyTypeNode)), structFieldTypeNode[industry](enumTypeNode(integerTypeNode[u8], enumVariantTypeNode[programming], enumVariantTypeNode[crypto], enumVariantTypeNode[music]))))',
    );
});

test('it can create indented strings', () => {
    // Given the following tree.
    const node = getTree();

    // When we get its indented debug string.
    const result = visit(node, getDebugStringVisitor({ indent: true }));

    // Then we expect the following string.
    expect(result).toEqual(`tupleTypeNode
|   integerTypeNode [u32]
|   structTypeNode
|   |   structFieldTypeNode [firstname]
|   |   |   stringTypeNode [utf8]
|   |   |   |   sizePrefixTransformNode
|   |   |   |   |   integerTypeNode [u64]
|   |   structFieldTypeNode [age]
|   |   |   integerTypeNode [u32]
|   |   structFieldTypeNode [wallet]
|   |   |   optionTypeNode
|   |   |   |   integerTypeNode [u16]
|   |   |   |   publicKeyTypeNode
|   |   structFieldTypeNode [industry]
|   |   |   enumTypeNode
|   |   |   |   integerTypeNode [u8]
|   |   |   |   enumVariantTypeNode [programming]
|   |   |   |   enumVariantTypeNode [crypto]
|   |   |   |   enumVariantTypeNode [music]`);
});

test('it reads the content of a textNode-valued attribute', () => {
    // Given an instruction status whose message is a rich textNode.
    const node = instructionStatusNode('deprecated', {
        message: textNode({ content: 'Use newInstruction instead' }),
    });

    // When we get its indented debug string.
    const result = visit(node, getDebugStringVisitor({ indent: true }));

    // Then the message content is surfaced (and the textNode child is visited).
    expect(result).toEqual(`instructionStatusNode [deprecated.Use newInstruction instead]
|   textNode [Use newInstruction instead]`);
});
