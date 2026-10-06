import {
    constantValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumValueNode,
    enumVariantTypeNode,
    hiddenPrefixTransformNode,
    integerTypeNode,
    integerValueNode,
    optionTypeNode,
    programLinkNode,
    programNode,
    rootNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getDefinedTypeLinksVisitor, getRecordLinkablesVisitor, LinkableDictionary, NodeStack, visit } from '../src';

test('it lists the defined types linked by a type without following them', () => {
    // Given a type linking to itself, to an alias, and to a type of another program within a transform.
    const amount = definedTypeNode({ identifier: 'amount', type: integerTypeNode('u64') });
    const length = definedTypeNode({ identifier: 'length', type: integerTypeNode('u32') });
    const node = definedTypeNode({
        identifier: 'node',
        type: structTypeNode([
            structFieldTypeNode({ identifier: 'value', type: definedTypeLinkNode('amount') }),
            structFieldTypeNode({
                identifier: 'label',
                type: stringTypeNode('utf8', {
                    transforms: [
                        hiddenPrefixTransformNode([
                            constantValueNode(
                                definedTypeLinkNode('length', { program: programLinkNode('other') }),
                                integerValueNode('0'),
                            ),
                        ]),
                    ],
                }),
            }),
            structFieldTypeNode({
                identifier: 'next',
                type: optionTypeNode(definedTypeLinkNode('node'), { prefix: integerTypeNode('u8') }),
            }),
        ]),
    });
    const program = programNode({ definedTypes: [node, amount], identifier: 'test', publicKey: '1111' });
    const otherProgram = programNode({ definedTypes: [length], identifier: 'other', publicKey: '2222' });
    const root = rootNode(program, { additionalPrograms: [otherProgram] });
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we list its links.
    const stack = new NodeStack();
    const paths = stack.visitPath([root, program, node], getDefinedTypeLinksVisitor(linkables, { stack }));

    // Then we get the path of each linked type, in order.
    expect(paths).toStrictEqual([
        [root, program, amount],
        [root, otherProgram, length],
        [root, program, node],
    ]);
});

test('it ignores the defined types of enum values and unresolved links', () => {
    // Given an enum whose variant defaults to one of its own values, next to a missing link.
    const direction = definedTypeNode({
        identifier: 'direction',
        type: enumTypeNode([
            enumVariantTypeNode('up'),
            enumVariantTypeNode('down', {
                data: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: enumValueNode('direction', 'up'),
                        identifier: 'then',
                        type: integerTypeNode('u8'),
                    }),
                    structFieldTypeNode({ identifier: 'missing', type: definedTypeLinkNode('missing') }),
                ]),
            }),
        ]),
    });
    const program = programNode({ definedTypes: [direction], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we list its links, then there are none.
    const stack = new NodeStack();
    expect(stack.visitPath([root, program, direction], getDefinedTypeLinksVisitor(linkables, { stack }))).toStrictEqual(
        [],
    );
});

test('it lists links nested deep within a type', () => {
    // Given a link nested within an option, a tuple, an enum variant and a struct.
    const amount = definedTypeNode({ identifier: 'amount', type: integerTypeNode('u64') });
    const payment = definedTypeNode({
        identifier: 'payment',
        type: structTypeNode([
            structFieldTypeNode({
                identifier: 'kind',
                type: enumTypeNode([
                    enumVariantTypeNode('free'),
                    enumVariantTypeNode('paid', {
                        data: tupleTypeNode([
                            integerTypeNode('u8'),
                            optionTypeNode(definedTypeLinkNode('amount'), { prefix: integerTypeNode('u8') }),
                        ]),
                    }),
                ]),
            }),
        ]),
    });
    const program = programNode({ definedTypes: [payment, amount], identifier: 'test', publicKey: '1111' });
    const root = rootNode(program);
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we list its links.
    const stack = new NodeStack();
    const paths = stack.visitPath([root, program, payment], getDefinedTypeLinksVisitor(linkables, { stack }));

    // Then the nested link is listed.
    expect(paths).toStrictEqual([[root, program, amount]]);
});

test('it cannot resolve links when visited without the path of the type', () => {
    // Given a type linking to an alias, both recorded.
    const amount = definedTypeNode({ identifier: 'amount', type: integerTypeNode('u64') });
    const wrapper = definedTypeNode({ identifier: 'wrapper', type: definedTypeLinkNode('amount') });
    const program = programNode({ definedTypes: [wrapper, amount], identifier: 'test', publicKey: '1111' });
    const linkables = new LinkableDictionary();
    visit(rootNode(program), getRecordLinkablesVisitor(linkables));

    // When we visit it on its own, without its program on the path.
    const paths = visit(wrapper, getDefinedTypeLinksVisitor(linkables));

    // Then its link cannot be resolved, which is why it must be visited with its full path.
    expect(paths).toStrictEqual([]);
});
