import type { CamelCaseString, Docs } from '../shared';
import type { TypeNode } from '../typeNodes';

export interface VariablePdaSeedNode<TType extends TypeNode = TypeNode> {
    readonly kind: 'variablePdaSeedNode';

    // Data.
    readonly name: CamelCaseString;
    readonly docs?: Docs;

    // Children.
    readonly type: TType;
}
