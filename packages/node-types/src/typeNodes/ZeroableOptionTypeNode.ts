import type { ConstantValueNode } from '../valueNodes';
import type { TypeNode } from './TypeNode';

export interface ZeroableOptionTypeNode<
    TItem extends TypeNode = TypeNode,
    TZeroValue extends ConstantValueNode | undefined = ConstantValueNode | undefined,
> {
    readonly kind: 'zeroableOptionTypeNode';

    // Children.
    readonly item: TItem;
    readonly zeroValue?: TZeroValue;
}
