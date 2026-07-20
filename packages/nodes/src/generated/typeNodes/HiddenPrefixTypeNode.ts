import type { ConstantValueNode, HiddenPrefixTypeNode, TypeNode } from '@codama/node-types';

/** Prefixes another type with a list of constant values that are written and read but not surfaced as fields to consumers. */
export function hiddenPrefixTypeNode<
    const TType extends TypeNode,
    const TPrefix extends Array<ConstantValueNode> | undefined,
>(type: TType, prefix: TPrefix): HiddenPrefixTypeNode<TType, TPrefix> {
    return Object.freeze({
        kind: 'hiddenPrefixTypeNode',

        // Children.
        type,
        ...(prefix !== undefined && prefix.length > 0 && { prefix: prefix as TPrefix }),
    });
}
