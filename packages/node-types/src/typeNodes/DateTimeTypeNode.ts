import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';

export interface DateTimeTypeNode<TNumber extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>> {
    readonly kind: 'dateTimeTypeNode';

    // Children.
    readonly number: TNumber;
}
