import { ConstantValueNode, IntegerTypeNode, Node, TransformNode, TypeNode } from '@codama/nodes';

import { visit, Visitor } from './visitor';

/** Whether a node carries a `transforms` array (i.e. is a type node). */
export function nodeHasTransforms(node: Node): node is TypeNode {
    return 'transforms' in node;
}

const sumSizes = (values: (number | null)[]): number | null =>
    values.reduce((all, one) => (all === null || one === null ? null : all + one), 0 as number | null);

/**
 * The node kinds a transform's own children reach when being sized (size
 * prefixes are integers; sentinels and hidden constants are constant values).
 * A byte-size visitor over a wider key set is assignable to this.
 */
type TransformChildVisitor = Visitor<number | null, 'constantValueNode' | 'integerTypeNode'>;

/** Apply a single transform's byte-size effect on top of the running size. */
function applyTransform(size: number | null, transform: TransformNode, self: TransformChildVisitor): number | null {
    const sizeOf = (child: ConstantValueNode | IntegerTypeNode): number | null => visit(child, self);
    switch (transform.kind) {
        case 'fixedSizeTransformNode':
            return transform.size;
        case 'sizePrefixTransformNode':
            return sumSizes([size, sizeOf(transform.prefix)]);
        case 'sentinelTransformNode':
            return sumSizes([size, sizeOf(transform.sentinel)]);
        case 'hiddenPrefixTransformNode':
            return sumSizes([size, ...(transform.prefix ?? []).map(sizeOf)]);
        case 'hiddenSuffixTransformNode':
            return sumSizes([size, ...(transform.suffix ?? []).map(sizeOf)]);
        case 'preOffsetTransformNode':
        case 'postOffsetTransformNode':
            return transform.strategy === 'padded' ? sumSizes([size, transform.offset]) : size;
    }
}

/**
 * Fold every transform on `node` over `leafSize` (the type's size without its
 * transforms), innermost-first, so each transform layers on the running size.
 * `self` sizes the transforms' own children (size prefixes, sentinels, hidden
 * constants). Shared by the fixed- and max-byte-size visitors, which apply
 * transforms identically.
 */
export function applyByteSizeTransforms(
    node: TypeNode,
    leafSize: number | null,
    self: TransformChildVisitor,
): number | null {
    return (node.transforms ?? []).reduce((all, transform) => applyTransform(all, transform, self), leafSize);
}
