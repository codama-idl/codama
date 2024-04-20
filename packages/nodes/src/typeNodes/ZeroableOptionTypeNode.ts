import type { ConstantValueNode, TypeNode, ZeroableOptionTypeNode } from '@kinobi-so/node-types';

export function zeroableOptionTypeNode<TItem extends TypeNode, TZeroValue extends ConstantValueNode | undefined>(
    item: TItem,
    zeroValue?: TZeroValue,
): ZeroableOptionTypeNode<TItem, TZeroValue> {
    return Object.freeze({
        kind: 'zeroableOptionTypeNode',

        // Children.
        item,
        ...(zeroValue !== undefined && { zeroValue }),
    });
}
