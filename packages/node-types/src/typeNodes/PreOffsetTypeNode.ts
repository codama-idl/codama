import type { TypeNode } from './TypeNode';

export interface PreOffsetTypeNode<TType extends TypeNode = TypeNode> {
    readonly kind: 'preOffsetTypeNode';

    // Data.
    readonly offset: number;
    readonly strategy: 'absolute' | 'padded' | 'relative';

    // Children.
    readonly type: TType;
}
