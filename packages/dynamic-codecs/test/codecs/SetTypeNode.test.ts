import {
    CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
} from '@codama/errors';
import {
    fixedCountNode,
    integerTypeNode,
    integerValueNode,
    Node,
    prefixedCountNode,
    remainderCountNode,
    setTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it decodes prefixed sets', () => {
    const codec = getNodeValueCodec([setTypeNode(integerTypeNode('u16'), prefixedCountNode(integerTypeNode('u32')))]);
    expect(codec.encode([42, 99, 650])).toStrictEqual(hex('030000002a0063008a02'));
    expect(codec.decode(hex('030000002a0063008a02'))).toStrictEqual([42n, 99n, 650n]);
});

test('it decodes fixed sets', () => {
    const codec = getNodeValueCodec([setTypeNode(integerTypeNode('u16'), fixedCountNode(3))]);
    expect(codec.encode([42, 99, 650])).toStrictEqual(hex('2a0063008a02'));
    expect(codec.decode(hex('2a0063008a02'))).toStrictEqual([42n, 99n, 650n]);
});

test('it decodes remainder sets', () => {
    const codec = getNodeValueCodec([setTypeNode(integerTypeNode('u16'), remainderCountNode())]);
    expect(codec.encode([42, 99, 650])).toStrictEqual(hex('2a0063008a02'));
    expect(codec.decode(hex('2a0063008a02'))).toStrictEqual([42n, 99n, 650n]);
});

/** Match a `DUPLICATE_SET_ITEM` error with exactly the given context. */
function duplicateSetItemError(context: { firstIndex: number; index: number; nodePath: readonly Node[] }) {
    return expect.objectContaining({
        context: { __code: CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM, ...context },
    });
}

test('it rejects duplicate items when encoding', () => {
    const set = setTypeNode(integerTypeNode('u16'), prefixedCountNode(integerTypeNode('u32')));
    const codec = getNodeValueCodec([set]);
    expect(() => codec.encode([42, 99, 42])).toThrow(
        duplicateSetItemError({ firstIndex: 0, index: 2, nodePath: [set] }),
    );
});

test('it compares items by their encoded bytes', () => {
    const set = setTypeNode(integerTypeNode('u16'), remainderCountNode());
    const codec = getNodeValueCodec([set]);
    expect(() => codec.encode([42, 99, 42n])).toThrow(
        duplicateSetItemError({ firstIndex: 0, index: 2, nodePath: [set] }),
    );
});

test('it rejects duplicate tuple items', () => {
    const set = setTypeNode(tupleTypeNode([integerTypeNode('u8'), stringTypeNode('utf8')]), fixedCountNode(3));
    const codec = getNodeValueCodec([set]);
    expect(() =>
        codec.encode([
            [1, 'a'],
            [2, 'a'],
            [2, 'a'],
        ]),
    ).toThrow(duplicateSetItemError({ firstIndex: 1, index: 2, nodePath: [set] }));
});

test('it rejects struct items that only differ by a field set to its default value', () => {
    const set = setTypeNode(
        structTypeNode([
            structFieldTypeNode({ identifier: 'id', type: integerTypeNode('u8') }),
            structFieldTypeNode({
                defaultValue: integerValueNode('0'),
                identifier: 'flags',
                type: integerTypeNode('u8'),
            }),
        ]),
        remainderCountNode(),
    );
    const codec = getNodeValueCodec([set]);
    expect(() => codec.encode([{ id: 1 }, { flags: 0, id: 1 }])).toThrow(
        duplicateSetItemError({ firstIndex: 0, index: 1, nodePath: [set] }),
    );
});

test('it reports the path of nested sets', () => {
    const set = setTypeNode(integerTypeNode('u8'), remainderCountNode());
    const field = structFieldTypeNode({ identifier: 'tags', type: set });
    const struct = structTypeNode([field]);
    const codec = getNodeValueCodec([struct]);
    expect(() => codec.encode({ tags: [1, 1] })).toThrow(
        duplicateSetItemError({ firstIndex: 0, index: 1, nodePath: [struct, field, set] }),
    );
});

test('it keeps duplicate items when decoding', () => {
    const codec = getNodeValueCodec([setTypeNode(integerTypeNode('u16'), remainderCountNode())]);
    expect(codec.decode(hex('2a002a00'))).toStrictEqual([42n, 42n]);
});

test('it rejects values that are not arrays as such', () => {
    const set = setTypeNode(integerTypeNode('u8'), remainderCountNode());
    const codec = getNodeValueCodec([set]);
    expect(() => codec.encode('abc')).toThrow(
        expect.objectContaining({
            context: {
                __code: CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
                actualType: 'string',
                expectedType: 'array',
                nodeKind: 'setTypeNode',
                nodePath: [set],
            },
        }),
    );
});

test('it rejects items of the wrong type before checking for duplicates', () => {
    const item = integerTypeNode('u8');
    const set = setTypeNode(item, remainderCountNode());
    const codec = getNodeValueCodec([set]);
    expect(() => codec.encode([1, 'x', 'x'])).toThrow(
        expect.objectContaining({
            context: {
                __code: CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
                actualType: 'string',
                expectedType: 'integer (number | bigint)',
                nodeKind: 'integerTypeNode',
                nodePath: [set, item],
            },
        }),
    );
});
