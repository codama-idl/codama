import type { ConstantValueNode, TypeNode, ZeroableOptionTypeNode } from '@codama/node-types';

/** An optional value whose absence is signalled by a designated zero value rather than a presence flag. */
export function zeroableOptionTypeNode<
    const TItem extends TypeNode,
    const TZeroValue extends ConstantValueNode | undefined = undefined,
>(item: TItem, zeroValue?: TZeroValue): ZeroableOptionTypeNode<TItem, TZeroValue> {
    return Object.freeze({
        kind: 'zeroableOptionTypeNode',

        // Children.
        item,
        ...(zeroValue !== undefined && { zeroValue }),
    });
}
