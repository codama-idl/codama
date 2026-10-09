import {
    accountNode,
    arrayTypeNode,
    booleanTypeNode,
    bytesTypeNode,
    constantValueNodeFromBytes,
    dateTimeTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    durationTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    eventNode,
    fixedPointTypeNode,
    fixedSizeTransformNode,
    floatTypeNode,
    hiddenPrefixTransformNode,
    hiddenSuffixTransformNode,
    instructionNode,
    integerTypeNode,
    mapTypeNode,
    optionTypeNode,
    postOffsetTransformNode,
    preOffsetTransformNode,
    prefixedCountNode,
    programLinkNode,
    programNode,
    publicKeyTypeNode,
    remainderCountNode,
    remainderOptionTypeNode,
    rootNode,
    sentinelCountNode,
    sentinelTransformNode,
    setTypeNode,
    sizePrefixTransformNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
    zeroableOptionTypeNode,
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import { getNodeCodec, getNodeValueCodec } from '../src';
import { hex } from './_setup';

describe('leaves', () => {
    test('it decodes integers as their value, path and cursor positions', () => {
        const node = integerTypeNode('u16');
        expect(getNodeCodec([node]).decode(hex('2a00'))).toStrictEqual({
            path: [node],
            postOffset: 2,
            preOffset: 0,
            value: 42n,
        });
    });

    test('it decodes cursor positions from the offset it starts reading at', () => {
        const node = integerTypeNode('u16');
        expect(getNodeCodec([node]).decode(hex('ff2a00'), 1)).toStrictEqual({
            path: [node],
            postOffset: 3,
            preOffset: 1,
            value: 42n,
        });
    });

    test('it decodes floats', () => {
        const node = floatTypeNode('f32');
        expect(getNodeCodec([node]).decode(hex('0000c03f'))).toStrictEqual({
            path: [node],
            postOffset: 4,
            preOffset: 0,
            value: 1.5,
        });
    });

    test('it decodes booleans', () => {
        const node = booleanTypeNode();
        expect(getNodeCodec([node]).decode(hex('01'))).toStrictEqual({
            path: [node],
            postOffset: 1,
            preOffset: 0,
            value: true,
        });
    });

    test('it decodes bytes', () => {
        const node = bytesTypeNode();
        expect(getNodeCodec([node]).decode(hex('0102'))).toStrictEqual({
            path: [node],
            postOffset: 2,
            preOffset: 0,
            value: ['base64', 'AQI='],
        });
    });

    test('it decodes strings', () => {
        const node = stringTypeNode('utf8');
        expect(getNodeCodec([node]).decode(hex('6869'))).toStrictEqual({
            path: [node],
            postOffset: 2,
            preOffset: 0,
            value: 'hi',
        });
    });

    test('it decodes public keys', () => {
        const node = publicKeyTypeNode();
        expect(getNodeCodec([node]).decode(new Uint8Array(32))).toStrictEqual({
            path: [node],
            postOffset: 32,
            preOffset: 0,
            value: '11111111111111111111111111111111',
        });
    });

    test('it decodes fixed points as their raw number, at their own path', () => {
        const node = fixedPointTypeNode(integerTypeNode('u32'), 2);
        expect(getNodeCodec([node]).decode(hex('39300000'))).toStrictEqual({
            path: [node],
            postOffset: 4,
            preOffset: 0,
            value: 12345n,
        });
    });

    test('it decodes date-times as their raw number, at their own path', () => {
        const node = dateTimeTypeNode(integerTypeNode('i64'));
        expect(getNodeCodec([node]).decode(hex('0100000000000000'))).toStrictEqual({
            path: [node],
            postOffset: 8,
            preOffset: 0,
            value: 1n,
        });
    });

    test('it decodes durations as their raw number, at their own path', () => {
        const node = durationTypeNode(integerTypeNode('u32'));
        expect(getNodeCodec([node]).decode(hex('100e0000'))).toStrictEqual({
            path: [node],
            postOffset: 4,
            preOffset: 0,
            value: 3600n,
        });
    });

    test('it encodes leaves from their value', () => {
        expect(getNodeCodec([integerTypeNode('u16')]).encode({ value: 42 })).toStrictEqual(hex('2a00'));
    });
});

describe('composites', () => {
    test('it decodes the fields of structs', () => {
        // Given a struct of two fields.
        const u8 = integerTypeNode('u8');
        const u16 = integerTypeNode('u16');
        const fieldA = structFieldTypeNode({ identifier: 'a', type: u8 });
        const fieldB = structFieldTypeNode({ identifier: 'b', type: u16 });
        const struct = structTypeNode([fieldA, fieldB]);

        // When we decode it.
        const decoded = getNodeCodec([struct]).decode(hex('010200'));

        // Then each field has its own decoded node and cursor positions.
        expect(decoded).toStrictEqual({
            fields: [
                {
                    path: [struct, fieldA],
                    postOffset: 1,
                    preOffset: 0,
                    type: { path: [struct, fieldA, u8], postOffset: 1, preOffset: 0, value: 1n },
                    value: 1n,
                },
                {
                    path: [struct, fieldB],
                    postOffset: 3,
                    preOffset: 1,
                    type: { path: [struct, fieldB, u16], postOffset: 3, preOffset: 1, value: 2n },
                    value: 2n,
                },
            ],
            path: [struct],
            postOffset: 3,
            preOffset: 0,
            value: { a: 1n, b: 2n },
        });
    });

    test('it decodes the variant of enums', () => {
        // Given an enum whose second variant holds a struct.
        const u8 = integerTypeNode('u8');
        const field = structFieldTypeNode({ identifier: 'x', type: u8 });
        const struct = structTypeNode([field]);
        const quit = enumVariantTypeNode('quit');
        const move = enumVariantTypeNode('move', { data: struct });
        const enumType = enumTypeNode([quit, move]);

        // When we decode its second variant.
        const decoded = getNodeCodec([enumType]).decode(hex('0105'));

        // Then the variant covers its discriminator and holds its data.
        const value = { __discriminator: 1, __kind: 'move', data: { x: 5n } };
        expect(decoded).toStrictEqual({
            path: [enumType],
            postOffset: 2,
            preOffset: 0,
            value,
            variant: {
                data: {
                    fields: [
                        {
                            path: [enumType, move, struct, field],
                            postOffset: 2,
                            preOffset: 1,
                            type: { path: [enumType, move, struct, field, u8], postOffset: 2, preOffset: 1, value: 5n },
                            value: 5n,
                        },
                    ],
                    path: [enumType, move, struct],
                    postOffset: 2,
                    preOffset: 1,
                    value: { x: 5n },
                },
                path: [enumType, move],
                postOffset: 2,
                preOffset: 0,
                value,
            },
        });
    });

    test('it decodes enum variants without data', () => {
        const quit = enumVariantTypeNode('quit');
        const enumType = enumTypeNode([quit]);
        const value = { __discriminator: 0, __kind: 'quit' };
        expect(getNodeCodec([enumType]).decode(hex('00'))).toStrictEqual({
            path: [enumType],
            postOffset: 1,
            preOffset: 0,
            value,
            variant: { path: [enumType, quit], postOffset: 1, preOffset: 0, value },
        });
    });

    test('it decodes enum variants outside of an enum, without discriminator', () => {
        const u8 = integerTypeNode('u8');
        const variant = enumVariantTypeNode('move', { data: u8 });
        expect(getNodeCodec([variant]).decode(hex('05'))).toStrictEqual({
            data: { path: [variant, u8], postOffset: 1, preOffset: 0, value: 5n },
            path: [variant],
            postOffset: 1,
            preOffset: 0,
            value: { __kind: 'move', data: 5n },
        });
    });

    test('it decodes the item of options that are present', () => {
        const u8 = integerTypeNode('u8');
        const option = optionTypeNode(u8);
        expect(getNodeCodec([option]).decode(hex('012a'))).toStrictEqual({
            item: { path: [option, u8], postOffset: 2, preOffset: 1, value: 42n },
            path: [option],
            postOffset: 2,
            preOffset: 0,
            value: { __option: 'Some', value: 42n },
        });
    });

    test('it decodes options that are absent without an item', () => {
        const option = optionTypeNode(integerTypeNode('u8'));
        expect(getNodeCodec([option]).decode(hex('00'))).toStrictEqual({
            path: [option],
            postOffset: 1,
            preOffset: 0,
            value: { __option: 'None' },
        });
    });

    test('it decodes the item of remainder options', () => {
        const u8 = integerTypeNode('u8');
        const option = remainderOptionTypeNode(u8);
        expect(getNodeCodec([option]).decode(hex('2a'))).toStrictEqual({
            item: { path: [option, u8], postOffset: 1, preOffset: 0, value: 42n },
            path: [option],
            postOffset: 1,
            preOffset: 0,
            value: { __option: 'Some', value: 42n },
        });
    });

    test('it decodes zeroable options that are absent without an item', () => {
        const option = zeroableOptionTypeNode(integerTypeNode('u16'));
        expect(getNodeCodec([option]).decode(hex('0000'))).toStrictEqual({
            path: [option],
            postOffset: 2,
            preOffset: 0,
            value: { __option: 'None' },
        });
    });

    test('it decodes the items of arrays', () => {
        const u16 = integerTypeNode('u16');
        const array = arrayTypeNode(u16, prefixedCountNode(integerTypeNode('u8')));
        expect(getNodeCodec([array]).decode(hex('0201000200'))).toStrictEqual({
            items: [
                { path: [array, u16], postOffset: 3, preOffset: 1, value: 1n },
                { path: [array, u16], postOffset: 5, preOffset: 3, value: 2n },
            ],
            path: [array],
            postOffset: 5,
            preOffset: 0,
            value: [1n, 2n],
        });
    });

    test('it decodes the items of arrays ending with a sentinel', () => {
        const u8 = integerTypeNode('u8');
        const array = arrayTypeNode(u8, sentinelCountNode(constantValueNodeFromBytes('base16', 'ff')));
        expect(getNodeCodec([array]).decode(hex('0102ff'))).toStrictEqual({
            items: [
                { path: [array, u8], postOffset: 1, preOffset: 0, value: 1n },
                { path: [array, u8], postOffset: 2, preOffset: 1, value: 2n },
            ],
            path: [array],
            postOffset: 3,
            preOffset: 0,
            value: [1n, 2n],
        });
    });

    test('it decodes the items of sets', () => {
        const u8 = integerTypeNode('u8');
        const set = setTypeNode(u8, remainderCountNode());
        expect(getNodeCodec([set]).decode(hex('0102'))).toStrictEqual({
            items: [
                { path: [set, u8], postOffset: 1, preOffset: 0, value: 1n },
                { path: [set, u8], postOffset: 2, preOffset: 1, value: 2n },
            ],
            path: [set],
            postOffset: 2,
            preOffset: 0,
            value: [1n, 2n],
        });
    });

    test('it decodes the items of tuples', () => {
        const u8 = integerTypeNode('u8');
        const u16 = integerTypeNode('u16');
        const tuple = tupleTypeNode([u8, u16]);
        expect(getNodeCodec([tuple]).decode(hex('010200'))).toStrictEqual({
            items: [
                { path: [tuple, u8], postOffset: 1, preOffset: 0, value: 1n },
                { path: [tuple, u16], postOffset: 3, preOffset: 1, value: 2n },
            ],
            path: [tuple],
            postOffset: 3,
            preOffset: 0,
            value: [1n, 2n],
        });
    });

    test('it decodes the entries of maps, keeping the decoded values of their keys', () => {
        // Given a map from integers to integers.
        const key = integerTypeNode('u16');
        const u8 = integerTypeNode('u8');
        const map = mapTypeNode(key, u8, prefixedCountNode(integerTypeNode('u8')));

        // When we decode it.
        const decoded = getNodeCodec([map]).decode(hex('01' + '0700' + '2a'));

        // Then its keys keep their decoded integer, which its object value turns into a string.
        expect(decoded).toStrictEqual({
            entries: [
                [
                    { path: [map, key], postOffset: 3, preOffset: 1, value: 7n },
                    { path: [map, u8], postOffset: 4, preOffset: 3, value: 42n },
                ],
            ],
            path: [map],
            postOffset: 4,
            preOffset: 0,
            value: { 7: 42n },
        });
    });

    test('it encodes composites from their value', () => {
        // Given a struct holding an array and an option.
        const struct = structTypeNode([
            structFieldTypeNode({
                identifier: 'items',
                type: arrayTypeNode(integerTypeNode('u8'), prefixedCountNode(integerTypeNode('u8'))),
            }),
            structFieldTypeNode({ identifier: 'maybe', type: optionTypeNode(integerTypeNode('u8')) }),
        ]);

        // When we encode its value, then we get the same bytes as its value codec.
        const value = { items: [1, 2], maybe: 3 };
        expect(getNodeCodec([struct]).encode({ value })).toStrictEqual(getNodeValueCodec([struct]).encode(value));
    });
});

describe('top-level nodes', () => {
    test('it decodes the data of accounts', () => {
        const u8 = integerTypeNode('u8');
        const account = accountNode({ data: u8, identifier: 'counter' });
        const root = rootNode(programNode({ accounts: [account], identifier: 'myProgram', publicKey: '1111' }));
        expect(getNodeCodec([root, root.program, account]).decode(hex('2a'))).toStrictEqual({
            data: { path: [root, root.program, account, u8], postOffset: 1, preOffset: 0, value: 42n },
            path: [root, root.program, account],
            postOffset: 1,
            preOffset: 0,
            value: 42n,
        });
    });

    test('it decodes the data of events', () => {
        const u8 = integerTypeNode('u8');
        const event = eventNode({ data: u8, identifier: 'tick' });
        const root = rootNode(programNode({ events: [event], identifier: 'myProgram', publicKey: '1111' }));
        expect(getNodeCodec([root, root.program, event]).decode(hex('2a'))).toStrictEqual({
            data: { path: [root, root.program, event, u8], postOffset: 1, preOffset: 0, value: 42n },
            path: [root, root.program, event],
            postOffset: 1,
            preOffset: 0,
            value: 42n,
        });
    });

    test('it decodes the data of instructions', () => {
        const u8 = integerTypeNode('u8');
        const instruction = instructionNode({ data: u8, identifier: 'ping' });
        expect(getNodeCodec([instruction]).decode(hex('2a'))).toStrictEqual({
            data: { path: [instruction, u8], postOffset: 1, preOffset: 0, value: 42n },
            path: [instruction],
            postOffset: 1,
            preOffset: 0,
            value: 42n,
        });
    });

    test('it decodes instructions without data as empty', () => {
        const instruction = instructionNode({ identifier: 'ping' });
        expect(getNodeCodec([instruction]).decode(hex(''))).toStrictEqual({
            path: [instruction],
            postOffset: 0,
            preOffset: 0,
            value: undefined,
        });
    });

    test('it decodes the type of defined types', () => {
        const u8 = integerTypeNode('u8');
        const definedType = definedTypeNode({ identifier: 'amount', type: u8 });
        const root = rootNode(programNode({ definedTypes: [definedType], identifier: 'myProgram', publicKey: '1111' }));
        expect(getNodeCodec([root, root.program, definedType]).decode(hex('2a'))).toStrictEqual({
            path: [root, root.program, definedType],
            postOffset: 1,
            preOffset: 0,
            type: { path: [root, root.program, definedType, u8], postOffset: 1, preOffset: 0, value: 42n },
            value: 42n,
        });
    });
});

describe('links', () => {
    test('it decodes links as the type of their defined type', () => {
        // Given a struct field linking to a defined type.
        const u8 = integerTypeNode('u8');
        const definedType = definedTypeNode({ identifier: 'amount', type: u8 });
        const field = structFieldTypeNode({ identifier: 'amount', type: definedTypeLinkNode('amount') });
        const struct = structTypeNode([field]);
        const root = rootNode(programNode({ definedTypes: [definedType], identifier: 'myProgram', publicKey: '1111' }));

        // When we decode the struct.
        const decoded = getNodeCodec([root, root.program, struct]).decode(hex('2a'));

        // Then the type of the field is the type of the defined type, at its own path.
        expect(decoded.fields[0].type).toStrictEqual({
            path: [root, root.program, definedType, u8],
            postOffset: 1,
            preOffset: 0,
            value: 42n,
        });
    });

    test('it decodes links to types of other programs', () => {
        // Given a type of program A linking to a type of program B.
        const u8 = integerTypeNode('u8');
        const typeB = definedTypeNode({ identifier: 'amount', type: u8 });
        const typeA = definedTypeNode({
            identifier: 'balance',
            type: definedTypeLinkNode('amount', { program: programLinkNode('programB') }),
        });
        const programA = programNode({ definedTypes: [typeA], identifier: 'programA', publicKey: '1111' });
        const programB = programNode({ definedTypes: [typeB], identifier: 'programB', publicKey: '2222' });
        const root = rootNode(programA, { additionalPrograms: [programB] });

        // When we decode the type of program A, then its type is the one of program B.
        expect(getNodeCodec([root, programA, typeA]).decode(hex('2a')).type).toStrictEqual({
            path: [root, programB, typeB, u8],
            postOffset: 1,
            preOffset: 0,
            value: 42n,
        });
    });

    test('it includes the transforms of links in the cursor positions of their type', () => {
        // Given a struct field linking to a string, with a size prefix on the link.
        const string = stringTypeNode('utf8');
        const definedType = definedTypeNode({ identifier: 'label', type: string });
        const link = definedTypeLinkNode('label', { transforms: [sizePrefixTransformNode(integerTypeNode('u8'))] });
        const struct = structTypeNode([structFieldTypeNode({ identifier: 'label', type: link })]);
        const root = rootNode(programNode({ definedTypes: [definedType], identifier: 'myProgram', publicKey: '1111' }));

        // When we decode it, then the type covers the size prefix of the link.
        const decoded = getNodeCodec([root, root.program, struct]).decode(hex('026869'));
        expect(decoded.fields[0].type).toStrictEqual({
            path: [root, root.program, definedType, string],
            postOffset: 3,
            preOffset: 0,
            value: 'hi',
        });
    });

    test('it decodes recursive types at every depth', () => {
        // Given a linked list.
        const u8 = integerTypeNode('u8');
        const next = optionTypeNode(definedTypeLinkNode('list'));
        const valueField = structFieldTypeNode({ identifier: 'value', type: u8 });
        const nextField = structFieldTypeNode({ identifier: 'next', type: next });
        const struct = structTypeNode([valueField, nextField]);
        const list = definedTypeNode({ identifier: 'list', type: struct });
        const root = rootNode(programNode({ definedTypes: [list], identifier: 'myProgram', publicKey: '1111' }));

        // When we decode a list of two items.
        const decoded = getNodeCodec([root, root.program, list]).decode(hex('01010200'));

        // Then the nested list has the same paths, with its own cursor positions.
        const path = [root, root.program, list, struct];
        const none = { __option: 'None' };
        const nested = {
            fields: [
                {
                    path: [...path, valueField],
                    postOffset: 3,
                    preOffset: 2,
                    type: { path: [...path, valueField, u8], postOffset: 3, preOffset: 2, value: 2n },
                    value: 2n,
                },
                {
                    path: [...path, nextField],
                    postOffset: 4,
                    preOffset: 3,
                    type: { path: [...path, nextField, next], postOffset: 4, preOffset: 3, value: none },
                    value: none,
                },
            ],
            path,
            postOffset: 4,
            preOffset: 2,
            value: { next: none, value: 2n },
        };
        expect(decoded).toStrictEqual({
            path: [root, root.program, list],
            postOffset: 4,
            preOffset: 0,
            type: {
                fields: [
                    {
                        path: [...path, valueField],
                        postOffset: 1,
                        preOffset: 0,
                        type: { path: [...path, valueField, u8], postOffset: 1, preOffset: 0, value: 1n },
                        value: 1n,
                    },
                    {
                        path: [...path, nextField],
                        postOffset: 4,
                        preOffset: 1,
                        type: {
                            item: nested,
                            path: [...path, nextField, next],
                            postOffset: 4,
                            preOffset: 1,
                            value: { __option: 'Some', value: nested.value },
                        },
                        value: { __option: 'Some', value: nested.value },
                    },
                ],
                path,
                postOffset: 4,
                preOffset: 0,
                value: { next: { __option: 'Some', value: nested.value }, value: 1n },
            },
            value: { next: { __option: 'Some', value: nested.value }, value: 1n },
        });
    });
});

describe('transforms', () => {
    // Each test decodes `struct { x: u8, inner: struct { a: u8 } }` with transforms on the inner
    // struct, after a first byte for `x`, and checks the cursor positions around the inner struct and its field.
    const u8 = integerTypeNode('u8');
    const getInnerStruct = (transforms: Parameters<typeof structTypeNode>[1]) => {
        const a = structFieldTypeNode({ identifier: 'a', type: u8 });
        const inner = structTypeNode([a], transforms);
        const innerField = structFieldTypeNode({ identifier: 'inner', type: inner });
        const struct = structTypeNode([structFieldTypeNode({ identifier: 'x', type: u8 }), innerField]);
        return { a, inner, innerField, struct };
    };

    test('it keeps cursor positions absolute within size prefixes', () => {
        const { a, inner, innerField, struct } = getInnerStruct({
            transforms: [sizePrefixTransformNode(integerTypeNode('u8'))],
        });
        expect(getNodeCodec([struct]).decode(hex('07' + '01' + '2a')).fields[1].type).toStrictEqual({
            fields: [
                {
                    path: [struct, innerField, inner, a],
                    postOffset: 3,
                    preOffset: 2,
                    type: { path: [struct, innerField, inner, a, u8], postOffset: 3, preOffset: 2, value: 42n },
                    value: 42n,
                },
            ],
            path: [struct, innerField, inner],
            postOffset: 3,
            preOffset: 1,
            value: { a: 42n },
        });
    });

    test('it keeps cursor positions absolute within nested size prefixes', () => {
        // Given a size-prefixed string within a size-prefixed struct.
        const string = stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u8'))] });
        const label = structFieldTypeNode({ identifier: 'label', type: string });
        const inner = structTypeNode([label], { transforms: [sizePrefixTransformNode(integerTypeNode('u8'))] });
        const innerField = structFieldTypeNode({ identifier: 'inner', type: inner });
        const struct = structTypeNode([structFieldTypeNode({ identifier: 'x', type: u8 }), innerField]);

        // When we decode it, then the string reports where it is in the whole bytes.
        const decoded = getNodeCodec([struct]).decode(hex('07' + '03' + '02' + '6869'));
        expect(decoded.fields[1].type).toStrictEqual({
            fields: [
                {
                    path: [struct, innerField, inner, label],
                    postOffset: 5,
                    preOffset: 2,
                    type: {
                        path: [struct, innerField, inner, label, string],
                        postOffset: 5,
                        preOffset: 2,
                        value: 'hi',
                    },
                    value: 'hi',
                },
            ],
            path: [struct, innerField, inner],
            postOffset: 5,
            preOffset: 1,
            value: { label: 'hi' },
        });
    });

    test('it keeps cursor positions absolute within fixed sizes', () => {
        const { a, inner, innerField, struct } = getInnerStruct({ transforms: [fixedSizeTransformNode(2)] });
        expect(getNodeCodec([struct]).decode(hex('07' + '2a00')).fields[1].type).toStrictEqual({
            fields: [
                {
                    path: [struct, innerField, inner, a],
                    postOffset: 2,
                    preOffset: 1,
                    type: { path: [struct, innerField, inner, a, u8], postOffset: 2, preOffset: 1, value: 42n },
                    value: 42n,
                },
            ],
            path: [struct, innerField, inner],
            postOffset: 3,
            preOffset: 1,
            value: { a: 42n },
        });
    });

    test('it keeps cursor positions absolute within sentinels', () => {
        const { a, inner, innerField, struct } = getInnerStruct({
            transforms: [sentinelTransformNode(constantValueNodeFromBytes('base16', 'ff'))],
        });
        expect(getNodeCodec([struct]).decode(hex('07' + '2aff')).fields[1].type).toStrictEqual({
            fields: [
                {
                    path: [struct, innerField, inner, a],
                    postOffset: 2,
                    preOffset: 1,
                    type: { path: [struct, innerField, inner, a, u8], postOffset: 2, preOffset: 1, value: 42n },
                    value: 42n,
                },
            ],
            path: [struct, innerField, inner],
            postOffset: 3,
            preOffset: 1,
            value: { a: 42n },
        });
    });

    test('it includes hidden prefixes and suffixes in cursor positions', () => {
        const { a, inner, innerField, struct } = getInnerStruct({
            transforms: [
                hiddenPrefixTransformNode([constantValueNodeFromBytes('base16', 'aa')]),
                hiddenSuffixTransformNode([constantValueNodeFromBytes('base16', 'bb')]),
            ],
        });
        expect(getNodeCodec([struct]).decode(hex('07' + 'aa2abb')).fields[1].type).toStrictEqual({
            fields: [
                {
                    path: [struct, innerField, inner, a],
                    postOffset: 3,
                    preOffset: 2,
                    type: { path: [struct, innerField, inner, a, u8], postOffset: 3, preOffset: 2, value: 42n },
                    value: 42n,
                },
            ],
            path: [struct, innerField, inner],
            postOffset: 4,
            preOffset: 1,
            value: { a: 42n },
        });
    });

    test('it includes padded offsets in cursor positions', () => {
        const { a, inner, innerField, struct } = getInnerStruct({
            transforms: [
                preOffsetTransformNode(1, { strategy: 'padded' }),
                postOffsetTransformNode(1, { strategy: 'padded' }),
            ],
        });
        expect(getNodeCodec([struct]).decode(hex('07' + '002a00')).fields[1].type).toStrictEqual({
            fields: [
                {
                    path: [struct, innerField, inner, a],
                    postOffset: 3,
                    preOffset: 2,
                    type: { path: [struct, innerField, inner, a, u8], postOffset: 3, preOffset: 2, value: 42n },
                    value: 42n,
                },
            ],
            path: [struct, innerField, inner],
            postOffset: 4,
            preOffset: 1,
            value: { a: 42n },
        });
    });

    test('it reports the cursor positions around nodes moving the cursor back with a relative pre-offset', () => {
        // Given a struct whose second field reads the byte before the cursor.
        const a = structFieldTypeNode({ identifier: 'a', type: u8 });
        const back = integerTypeNode('u8', { transforms: [preOffsetTransformNode(-1, { strategy: 'relative' })] });
        const b = structFieldTypeNode({ identifier: 'b', type: back });
        const struct = structTypeNode([a, b]);

        // When we decode it, then the second field starts and ends at the cursor, having read the first byte again.
        expect(getNodeCodec([struct]).decode(hex('2a')).fields[1]).toStrictEqual({
            path: [struct, b],
            postOffset: 1,
            preOffset: 1,
            type: { path: [struct, b, back], postOffset: 1, preOffset: 1, value: 42n },
            value: 42n,
        });
    });

    test('it reports the cursor positions around nodes rewinding the cursor with an absolute post-offset', () => {
        // Given a struct whose second field moves the cursor back to the start after being read.
        const a = structFieldTypeNode({ identifier: 'a', type: u8 });
        const rewind = integerTypeNode('u8', { transforms: [postOffsetTransformNode(0, { strategy: 'absolute' })] });
        const b = structFieldTypeNode({ identifier: 'b', type: rewind });
        const struct = structTypeNode([a, b]);

        // When we decode it, then the second field ends where the cursor was moved to.
        expect(getNodeCodec([struct]).decode(hex('0102')).fields[1]).toStrictEqual({
            path: [struct, b],
            postOffset: 0,
            preOffset: 1,
            type: { path: [struct, b, rewind], postOffset: 0, preOffset: 1, value: 2n },
            value: 2n,
        });
    });

    test('it reports where the children of a node moved by an absolute pre-offset are read', () => {
        // Given a struct whose inner struct is read from the third byte.
        const { a, inner, innerField, struct } = getInnerStruct({
            transforms: [preOffsetTransformNode(2, { strategy: 'absolute' })],
        });

        // When we decode it, then the inner struct spans from the cursor before it, and its field is at the third byte.
        expect(getNodeCodec([struct]).decode(hex('07' + 'ff' + '2a')).fields[1].type).toStrictEqual({
            fields: [
                {
                    path: [struct, innerField, inner, a],
                    postOffset: 3,
                    preOffset: 2,
                    type: { path: [struct, innerField, inner, a, u8], postOffset: 3, preOffset: 2, value: 42n },
                    value: 42n,
                },
            ],
            path: [struct, innerField, inner],
            postOffset: 3,
            preOffset: 1,
            value: { a: 42n },
        });
    });

    test('it keeps cursor positions absolute within arrays ending with a sentinel', () => {
        // Given a struct holding an array ending with a sentinel after a first field.
        const array = arrayTypeNode(u8, sentinelCountNode(constantValueNodeFromBytes('base16', 'ff')));
        const items = structFieldTypeNode({ identifier: 'items', type: array });
        const struct = structTypeNode([structFieldTypeNode({ identifier: 'x', type: u8 }), items]);

        // When we decode it, then the items report where they are in the whole bytes.
        expect(getNodeCodec([struct]).decode(hex('07' + '0102ff')).fields[1].type).toStrictEqual({
            items: [
                { path: [struct, items, array, u8], postOffset: 2, preOffset: 1, value: 1n },
                { path: [struct, items, array, u8], postOffset: 3, preOffset: 2, value: 2n },
            ],
            path: [struct, items, array],
            postOffset: 4,
            preOffset: 1,
            value: [1n, 2n],
        });
    });
});
