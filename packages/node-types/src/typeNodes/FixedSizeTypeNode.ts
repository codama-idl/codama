import type { TypeNode } from './TypeNode';

export interface FixedSizeTypeNode<TType extends TypeNode = TypeNode> {
    readonly kind: 'fixedSizeTypeNode';

    // Data.
    readonly size: number;

    // Children.
    readonly type: TType;
}
