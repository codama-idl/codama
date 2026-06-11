import type { ConstantValueNode } from '../valueNodes/ConstantValueNode';
import type { TypeNode } from './TypeNode';

/** An optional value whose absence is signalled by a designated zero value rather than a presence flag. */
export interface ZeroableOptionTypeNode<
    TItem extends TypeNode = TypeNode,
    TZeroValue extends ConstantValueNode | undefined = ConstantValueNode | undefined,
> {
    readonly kind: 'zeroableOptionTypeNode';

    // Children.
    /** The type carried by the option when present. */
    readonly item: TItem;
    /** The constant value that signals absence. When omitted, the all-zero byte pattern of the item type is used. */
    readonly zeroValue?: TZeroValue;
}
