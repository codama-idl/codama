import type { CamelCaseString, Docs } from './shared';
import type { TypeNode } from './typeNodes/TypeNode';

export interface DefinedTypeNode<TType extends TypeNode = TypeNode> {
    readonly kind: 'definedTypeNode';

    // Data.
    readonly name: CamelCaseString;
    readonly docs?: Docs;

    // Children.
    readonly type: TType;
}
