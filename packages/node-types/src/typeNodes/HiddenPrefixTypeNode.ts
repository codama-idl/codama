import type { ConstantValueNode } from '../valueNodes';
import type { TypeNode } from './TypeNode';

export interface HiddenPrefixTypeNode<
    TType extends TypeNode = TypeNode,
    TPrefix extends ConstantValueNode[] = ConstantValueNode[],
> {
    readonly kind: 'hiddenPrefixTypeNode';

    // Children.
    readonly type: TType;
    readonly prefix: TPrefix;
}
