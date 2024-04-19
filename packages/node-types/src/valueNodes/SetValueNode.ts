import type { ValueNode } from './ValueNode';

export interface SetValueNode<TItems extends ValueNode[] = ValueNode[]> {
    readonly kind: 'setValueNode';

    // Children.
    readonly items: TItems;
}
