import type { MainCaseString } from './shared';
import type { TypeNode } from './typeNodes/TypeNode';

export interface DefinedTypeNode<TType extends TypeNode = TypeNode> {
    readonly kind: 'definedTypeNode';

    // Data.
    readonly name: MainCaseString;
    readonly docs: string[];

    // Children.
    readonly type: TType;
}
