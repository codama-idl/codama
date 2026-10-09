import {
    CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED,
    CodamaError,
} from '@codama/errors';
import {
    arrayTypeNode,
    constantValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    fixedSizeTransformNode,
    hiddenPrefixTransformNode,
    injectedValueNode,
    integerTypeNode,
    optionTypeNode,
    prefixedCountNode,
    programLinkNode,
    programNode,
    remainderOptionTypeNode,
    rootNode,
    sentinelTransformNode,
    sizePrefixTransformNode,
    stringTypeNode,
    stringValueNode,
    structFieldTypeNode,
    structTypeNode,
    zeroableOptionTypeNode,
} from '@codama/nodes';
import { getRecordLinkablesVisitor, LinkableDictionary, NodeStack, visit } from '@codama/visitors-core';
import { SOLANA_ERROR__CODECS__EXPECTED_FIXED_LENGTH } from '@solana/errors';
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

test('it encodes defined types linking to themselves', () => {
    // Given a linked list.
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
    const root = rootNode(programNode({ definedTypes: [list], identifier: 'myProgram', publicKey: '1111' }));

    // When we get its codec.
    const codec = getNodeValueCodec([root, root.program, list]);

    // Then it encodes and decodes lists of any length.
    const value = {
        next: {
            __option: 'Some',
            value: { next: { __option: 'Some', value: { next: { __option: 'None' }, value: 3n } }, value: 2n },
        },
        value: 1n,
    };
    expect(codec.encode(value)).toStrictEqual(hex('010102010300'));
    expect(codec.decode(hex('010102010300'))).toStrictEqual(value);
    expect(codec.decode(hex('0100'))).toStrictEqual({ next: { __option: 'None' }, value: 1n });
});

test('it encodes defined types linking to themselves through enum variants', () => {
    // Given a tree whose nodes hold a list of trees.
    const tree = definedTypeNode({
        identifier: 'tree',
        type: enumTypeNode([
            enumVariantTypeNode('leaf'),
            enumVariantTypeNode('node', {
                data: arrayTypeNode(definedTypeLinkNode('tree'), prefixedCountNode(integerTypeNode('u8'))),
            }),
        ]),
    });
    const root = rootNode(programNode({ definedTypes: [tree], identifier: 'myProgram', publicKey: '1111' }));

    // When we get its codec.
    const codec = getNodeValueCodec([root, root.program, tree]);

    // Then it encodes and decodes nested trees.
    const leaf = { __discriminator: 0, __kind: 'leaf' };
    const value = {
        __discriminator: 1,
        __kind: 'node',
        data: [leaf, { __discriminator: 1, __kind: 'node', data: [leaf] }],
    };
    expect(codec.encode(value)).toStrictEqual(hex('0102000101' + '00'));
    expect(codec.decode(hex('010200010100'))).toStrictEqual(value);
});

test('it encodes defined types linking to themselves through other defined types', () => {
    // Given a person whose friends link back to people.
    const person = definedTypeNode({
        identifier: 'person',
        type: structTypeNode([
            structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u8') }),
            structFieldTypeNode({ identifier: 'friends', type: definedTypeLinkNode('friends') }),
        ]),
    });
    const friends = definedTypeNode({
        identifier: 'friends',
        type: arrayTypeNode(definedTypeLinkNode('person'), prefixedCountNode(integerTypeNode('u8'))),
    });
    const root = rootNode(programNode({ definedTypes: [person, friends], identifier: 'myProgram', publicKey: '1111' }));

    // When we get the codec of the person.
    const codec = getNodeValueCodec([root, root.program, person]);

    // Then it encodes and decodes people with friends.
    const value = { age: 30n, friends: [{ age: 25n, friends: [] }] };
    expect(codec.encode(value)).toStrictEqual(hex('1e01' + '1900'));
    expect(codec.decode(hex('1e011900'))).toStrictEqual(value);
});

test('it applies the transforms of links to themselves at every depth', () => {
    // Given a list whose links back to itself are size-prefixed.
    const list = definedTypeNode({
        identifier: 'list',
        type: structTypeNode([
            structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u8') }),
            structFieldTypeNode({
                identifier: 'next',
                type: remainderOptionTypeNode(
                    definedTypeLinkNode('list', { transforms: [sizePrefixTransformNode(integerTypeNode('u8'))] }),
                ),
            }),
        ]),
    });
    const root = rootNode(programNode({ definedTypes: [list], identifier: 'myProgram', publicKey: '1111' }));

    // When we get its codec.
    const codec = getNodeValueCodec([root, root.program, list]);

    // Then each nested list is prefixed with its size.
    const value = {
        next: {
            __option: 'Some',
            value: { next: { __option: 'Some', value: { next: { __option: 'None' }, value: 3n } }, value: 2n },
        },
        value: 1n,
    };
    expect(codec.encode(value)).toStrictEqual(hex('01' + '03' + '02' + '01' + '03'));
    expect(codec.decode(hex('0103020103'))).toStrictEqual(value);
});

test('it rejects defined types whose every value nests another one', () => {
    // Given a loop with no way out.
    const loop = definedTypeNode({
        identifier: 'loop',
        type: structTypeNode([structFieldTypeNode({ identifier: 'next', type: definedTypeLinkNode('loop') })]),
    });
    const root = rootNode(programNode({ definedTypes: [loop], identifier: 'myProgram', publicKey: '1111' }));

    // When we get its codec, then it throws.
    expect(() => getNodeValueCodec([root, root.program, loop])).toThrow(
        new CodamaError(CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE, {
            name: loop.identifier,
            path: [root, root.program, loop],
        }),
    );
});

test('it rejects defined types aliasing themselves', () => {
    // Given a type aliasing itself.
    const alias = definedTypeNode({ identifier: 'alias', type: definedTypeLinkNode('alias') });
    const root = rootNode(programNode({ definedTypes: [alias], identifier: 'myProgram', publicKey: '1111' }));

    // When we get its codec, then it throws.
    expect(() => getNodeValueCodec([root, root.program, alias])).toThrow(
        new CodamaError(CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE, {
            name: alias.identifier,
            path: [root, root.program, alias],
        }),
    );
});

test('it names the defined type with no finite value when linking to it', () => {
    // Given a type linking to a loop with no way out.
    const loop = definedTypeNode({
        identifier: 'loop',
        type: structTypeNode([structFieldTypeNode({ identifier: 'next', type: definedTypeLinkNode('loop') })]),
    });
    const usesLoop = definedTypeNode({ identifier: 'usesLoop', type: definedTypeLinkNode('loop') });
    const root = rootNode(programNode({ definedTypes: [loop, usesLoop], identifier: 'myProgram', publicKey: '1111' }));

    // When we get the codec of the type linking to it, then it throws for the loop.
    expect(() => getNodeValueCodec([root, root.program, usesLoop])).toThrow(
        new CodamaError(CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE, {
            name: loop.identifier,
            path: [root, root.program, loop],
        }),
    );
});

test('it does not mistake links to same-named types of other programs for recursion', () => {
    // Given a type of program A linking to a same-named type of program B.
    const typeA = definedTypeNode({
        identifier: 'config',
        type: definedTypeLinkNode('config', { program: programLinkNode('programB') }),
    });
    const typeB = definedTypeNode({ identifier: 'config', type: integerTypeNode('u32') });
    const programA = programNode({ definedTypes: [typeA], identifier: 'programA', publicKey: '1111' });
    const programB = programNode({ definedTypes: [typeB], identifier: 'programB', publicKey: '2222' });
    const root = rootNode(programA, { additionalPrograms: [programB] });

    // When we get the codec of the type of program A.
    const codec = getNodeValueCodec([root, programA, typeA]);

    // Then it uses the type of program B, which has a fixed size.
    expect(codec.encode(42)).toStrictEqual(hex('2a000000'));
    expect(codec).toHaveProperty('fixedSize', 4);
});

test('it rejects recursive items of zeroable options, which must have a fixed size', () => {
    // Given a list whose next item is a zeroable option.
    const list = definedTypeNode({
        identifier: 'list',
        type: structTypeNode([
            structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u8') }),
            structFieldTypeNode({ identifier: 'next', type: zeroableOptionTypeNode(definedTypeLinkNode('list')) }),
        ]),
    });
    const root = rootNode(programNode({ definedTypes: [list], identifier: 'myProgram', publicKey: '1111' }));

    // When we get its codec, then it throws since a recursive type has no fixed size.
    expect(() => getNodeValueCodec([root, root.program, list])).toThrow(
        expect.objectContaining({
            context: expect.objectContaining({ __code: SOLANA_ERROR__CODECS__EXPECTED_FIXED_LENGTH }),
        }),
    );
});

test('it rejects defined types requiring a value of themselves to be created', () => {
    // Given a list whose optional label ends with a sentinel typed as the list itself.
    const list = definedTypeNode({
        identifier: 'list',
        type: structTypeNode([
            structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u8') }),
            structFieldTypeNode({
                identifier: 'label',
                type: optionTypeNode(
                    stringTypeNode('utf8', {
                        transforms: [
                            sentinelTransformNode(constantValueNode(definedTypeLinkNode('list'), stringValueNode('x'))),
                        ],
                    }),
                    { prefix: integerTypeNode('u8') },
                ),
            }),
        ]),
    });
    const root = rootNode(programNode({ definedTypes: [list], identifier: 'myProgram', publicKey: '1111' }));

    // When we get its codec, then it throws since the sentinel needs the codec being created.
    expect(() => getNodeValueCodec([root, root.program, list])).toThrow(
        new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
            message: 'The codec of defined type [list] was used while being created',
        }),
    );
});
