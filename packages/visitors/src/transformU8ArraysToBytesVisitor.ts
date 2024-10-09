import {
    ArrayTypeNode,
    arrayTypeNode,
    assertIsNode,
    bytesTypeNode,
    fixedSizeTypeNode,
    isNode,
    TYPE_NODES,
} from '@codama/nodes';
import { extendVisitor, nonNullableIdentityVisitor, pipe, visit } from '@codama/visitors-core';

export function transformU8ArraysToBytesVisitor(sizes: number[] | '*' = [32, 64]) {
    const hasRequiredSize = (count: ArrayTypeNode['count']): boolean => {
        if (!isNode(count, 'fixedCountNode')) return false;
        return sizes === '*' || sizes.includes(count.value);
    };

    return pipe(nonNullableIdentityVisitor(), v =>
        extendVisitor(v, {
            visitArrayType(node, { self }) {
                const child = visit(node.item, self);
                assertIsNode(child, TYPE_NODES);

                if (
                    isNode(child, 'numberTypeNode') &&
                    child.format === 'u8' &&
                    isNode(node.count, 'fixedCountNode') &&
                    hasRequiredSize(node.count)
                ) {
                    return fixedSizeTypeNode(bytesTypeNode(), node.count.value);
                }

                return arrayTypeNode(child, node.count);
            },
        }),
    );
}
