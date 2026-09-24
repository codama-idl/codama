import {
    arrayTypeNode,
    bytesTypeNode,
    fixedCountNode,
    fixedSizeTransformNode,
    integerTypeNode,
    pluginNode,
    prefixedCountNode,
    sizePrefixTransformNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { transformU8ArraysToBytesVisitor } from '../src';

test('it transforms fixed-size u8 arrays into fixed-size bytes', () => {
    // Given a fixed-size array of u8.
    const node = arrayTypeNode(integerTypeNode('u8'), fixedCountNode(32));

    // When we transform u8 arrays into bytes.
    const result = visit(node, transformU8ArraysToBytesVisitor());

    // Then we get fixed-size bytes.
    expect(result).toStrictEqual(bytesTypeNode({ transforms: [fixedSizeTransformNode(32)] }));
});

test('it only transforms arrays of the given sizes', () => {
    // Given two fixed-size arrays of u8 of different sizes.
    const small = arrayTypeNode(integerTypeNode('u8'), fixedCountNode(8));
    const large = arrayTypeNode(integerTypeNode('u8'), fixedCountNode(32));

    // When we only transform arrays of size 32.
    const visitor = transformU8ArraysToBytesVisitor([32]);

    // Then only the large array is transformed.
    expect(visit(small, visitor)).toStrictEqual(small);
    expect(visit(large, visitor)).toStrictEqual(bytesTypeNode({ transforms: [fixedSizeTransformNode(32)] }));
});

test('it keeps the transforms and plugins of the array outside the fixed size', () => {
    // Given a fixed-size array of u8 with transforms and plugins.
    const node = arrayTypeNode(integerTypeNode('u8'), fixedCountNode(32), {
        plugins: [pluginNode('my.plugin')],
        transforms: [sizePrefixTransformNode(integerTypeNode('u32'))],
    });

    // When we transform it.
    const result = visit(node, transformU8ArraysToBytesVisitor());

    // Then the fixed size is innermost, followed by the array's transforms.
    expect(result).toStrictEqual(
        bytesTypeNode({
            plugins: [pluginNode('my.plugin')],
            transforms: [fixedSizeTransformNode(32), sizePrefixTransformNode(integerTypeNode('u32'))],
        }),
    );
});

test('it does not transform arrays whose items are not plain u8', () => {
    // Given arrays whose u8 items carry a unit or transforms, or are not u8.
    const nodes = [
        arrayTypeNode(integerTypeNode('u8', { unit: 'bps' }), fixedCountNode(4)),
        arrayTypeNode(integerTypeNode('u8', { transforms: [fixedSizeTransformNode(2)] }), fixedCountNode(4)),
        arrayTypeNode(integerTypeNode('u16'), fixedCountNode(4)),
        arrayTypeNode(integerTypeNode('u8'), prefixedCountNode(integerTypeNode('u32'))),
    ];

    // When we transform them, then nothing changes.
    nodes.forEach(node => expect(visit(node, transformU8ArraysToBytesVisitor())).toStrictEqual(node));
});

test('it transforms nested arrays', () => {
    // Given an array of fixed-size u8 arrays.
    const node = arrayTypeNode(arrayTypeNode(integerTypeNode('u8'), fixedCountNode(32)), fixedCountNode(2));

    // When we transform u8 arrays into bytes.
    const result = visit(node, transformU8ArraysToBytesVisitor());

    // Then the inner array is transformed.
    expect(result).toStrictEqual(
        arrayTypeNode(bytesTypeNode({ transforms: [fixedSizeTransformNode(32)] }), fixedCountNode(2)),
    );
});
