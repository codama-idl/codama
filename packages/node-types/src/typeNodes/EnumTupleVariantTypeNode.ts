import type { MainCaseString } from '../shared';
import type { NestedTypeNode } from './NestedTypeNode';
import type { TupleTypeNode } from './TupleTypeNode';

export interface EnumTupleVariantTypeNode<
    TTuple extends NestedTypeNode<TupleTypeNode> = NestedTypeNode<TupleTypeNode>,
> {
    readonly kind: 'enumTupleVariantTypeNode';

    // Data.
    readonly name: MainCaseString;
    readonly discriminator?: number;

    // Children.
    readonly tuple: TTuple;
}
