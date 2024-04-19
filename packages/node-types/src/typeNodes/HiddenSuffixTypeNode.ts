import type { ConstantValueNode } from '../valueNodes';
import type { TypeNode } from './TypeNode';

export interface HiddenSuffixTypeNode<
    TType extends TypeNode = TypeNode,
    TSuffix extends ConstantValueNode[] = ConstantValueNode[],
> {
    readonly kind: 'hiddenSuffixTypeNode';

    // Children.
    readonly type: TType;
    readonly suffix: TSuffix;
}
