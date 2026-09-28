import { CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED, CodamaError } from '@codama/errors';
import {
    constantValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    fixedSizeTransformNode,
    hiddenPrefixTransformNode,
    injectedValueNode,
    integerTypeNode,
    programLinkNode,
    programNode,
    rootNode,
    sizePrefixTransformNode,
    stringTypeNode,
} from '@codama/nodes';
import { getRecordLinkablesVisitor, LinkableDictionary, NodeStack, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getNodeValueCodec, getNodeValueCodecVisitor } from '../../src';
import { hex } from '../_setup';

test('it resolves the codec of defined type link nodes', () => {
    // Given an existing defined type and a LinkNode pointing to it.
    const slotType = definedTypeNode({ identifier: 'slot', type: integerTypeNode('u64') });
    const lastSlotType = definedTypeNode({ identifier: 'lastSlot', type: definedTypeLinkNode('slot') });
    const root = rootNode(
        programNode({ definedTypes: [slotType, lastSlotType], identifier: 'myProgram', publicKey: '1111' }),
    );

    // When we get the codec for the defined type pointing to another defined type.
    const codec = getNodeValueCodec([root, root.program, lastSlotType]);

    // Then we expect the codec to match the linked defined type.
    expect(codec.encode(42)).toStrictEqual(hex('2a00000000000000'));
    expect(codec.decode(hex('2a00000000000000'))).toBe(42n);
});

test('it follows linked nodes using the correct paths', () => {
    // Given two link nodes designed so that the path would
    // fail if we did not save and restored linked paths.
    const typeA = definedTypeNode({
        identifier: 'typeA',
        type: definedTypeLinkNode('typeB1', { program: programLinkNode('programB') }),
    });
    const programA = programNode({ definedTypes: [typeA], identifier: 'programA', publicKey: '1111' });
    const programB = programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'typeB1', type: definedTypeLinkNode('typeB2') }),
            definedTypeNode({ identifier: 'typeB2', type: integerTypeNode('u64') }),
        ],
        identifier: 'programB',
        publicKey: '2222',
    });
    const root = rootNode(programA, { additionalPrograms: [programB] });

    // When we get the codec for the defined type in programA.
    const codec = getNodeValueCodec([root, programA, typeA]);

    // Then we expect the links in programB to be resolved correctly.
    expect(codec.encode(42)).toStrictEqual(hex('2a00000000000000'));
    expect(codec.decode(hex('2a00000000000000'))).toBe(42n);
});

test('it layers the transforms of the link on top of the linked type', () => {
    // Given a fixed-size string type and a link to it that adds a size prefix.
    const nameType = definedTypeNode({
        identifier: 'name',
        type: stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(4)] }),
    });
    const link = definedTypeLinkNode('name', { transforms: [sizePrefixTransformNode(integerTypeNode('u8'))] });
    const wrapperType = definedTypeNode({ identifier: 'wrapper', type: link });
    const root = rootNode(
        programNode({ definedTypes: [nameType, wrapperType], identifier: 'myProgram', publicKey: '1111' }),
    );

    // When we get the codec for the type using the link.
    const codec = getNodeValueCodec([root, root.program, wrapperType]);

    // Then the size prefix wraps the fixed-size string.
    expect(codec.encode('abc')).toStrictEqual(hex('0461626300'));
    expect(codec.decode(hex('0461626300'))).toBe('abc');
});

test('it restores the node stack when a linked type throws', () => {
    // Given a type in programB whose bytes depend on an injected value that nothing provides.
    const tag = injectedValueNode({ key: 'tag' });
    const programB = programNode({
        definedTypes: [
            definedTypeNode({
                identifier: 'tagged',
                type: integerTypeNode('u16', {
                    transforms: [hiddenPrefixTransformNode([constantValueNode(integerTypeNode('u8'), tag)])],
                }),
            }),
        ],
        identifier: 'programB',
        publicKey: '2222',
    });

    // And a type that only exists in programA.
    const programA = programNode({
        definedTypes: [definedTypeNode({ identifier: 'amount', type: integerTypeNode('u32') })],
        identifier: 'programA',
        publicKey: '1111',
    });
    const root = rootNode(programA, { additionalPrograms: [programB] });
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // And a codec visitor reused from within programA.
    const stack = new NodeStack([root, programA]);
    const visitor = getNodeValueCodecVisitor(linkables, { stack });

    // When visiting a link into programB throws.
    const taggedLink = definedTypeLinkNode('tagged', { program: programLinkNode('programB') });
    expect(() => visit(taggedLink, visitor)).toThrow(
        new CodamaError(CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED, { injectedValue: tag, key: tag.key }),
    );

    // Then the stack is back within programA, so later links still resolve there.
    expect(stack.getPath()).toStrictEqual([root, programA]);
    const codec = visit(definedTypeLinkNode('amount'), visitor);
    expect(codec.encode(42)).toStrictEqual(hex('2a000000'));
});
