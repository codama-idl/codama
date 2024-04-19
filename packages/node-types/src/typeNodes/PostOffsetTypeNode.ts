import type { TypeNode } from './TypeNode';

export interface PostOffsetTypeNode<TType extends TypeNode = TypeNode> {
    readonly kind: 'postOffsetTypeNode';

    // Data.
    readonly offset: number;
    readonly strategy: 'absolute' | 'padded' | 'preOffset' | 'relative';

    // Children.
    readonly type: TType;
}
