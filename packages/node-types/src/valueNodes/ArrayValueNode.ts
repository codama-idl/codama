import type { ValueNode } from './ValueNode';

export interface ArrayValueNode<TItems extends ValueNode[] = ValueNode[]> {
    readonly kind: 'arrayValueNode';

    // Children.
    readonly items: TItems;
}
