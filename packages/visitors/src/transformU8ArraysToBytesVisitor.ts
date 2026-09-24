import { assertIsNode, bytesTypeNode, fixedSizeTransformNode, isNode, TypeNode } from '@codama/nodes';
import { extendVisitor, nonNullableIdentityVisitor, pipe } from '@codama/visitors-core';

/**
 * Turn fixed-size arrays of `u8` into fixed-size bytes, optionally only for
 * the given sizes.
 *
 * Only plain `u8` items are converted: an item carrying a `unit`, `display`,
 * `transforms` or `plugins` has semantics that bytes cannot express. The
 * array's own `transforms` and `plugins` are carried over, outside the
 * fixed size.
 *
 * @example
 * ```ts
 * // arrayTypeNode(integerTypeNode('u8'), fixedCountNode(32))
 * // becomes bytesTypeNode({ transforms: [fixedSizeTransformNode(32)] })
 * transformU8ArraysToBytesVisitor([32]);
 * ```
 */
export function transformU8ArraysToBytesVisitor(sizes: number[] | '*' = '*') {
    return pipe(nonNullableIdentityVisitor(), v =>
        extendVisitor(v, {
            visitArrayType(node, { next }) {
                const array = next(node);
                assertIsNode(array, 'arrayTypeNode');
                if (!isPlainU8(array.item) || !isNode(array.count, 'fixedCountNode')) return array;
                const size = array.count.value;
                if (sizes !== '*' && !sizes.includes(size)) return array;

                return bytesTypeNode({
                    plugins: array.plugins,
                    transforms: [fixedSizeTransformNode(size), ...(array.transforms ?? [])],
                });
            },
        }),
    );
}

function isPlainU8(node: TypeNode): boolean {
    return (
        isNode(node, 'integerTypeNode') &&
        node.format === 'u8' &&
        node.unit === undefined &&
        node.display === undefined &&
        (node.transforms ?? []).length === 0 &&
        (node.plugins ?? []).length === 0
    );
}
