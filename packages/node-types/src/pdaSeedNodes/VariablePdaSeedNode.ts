import type { MainCaseString } from '../shared';
import type { TypeNode } from '../typeNodes';

export interface VariablePdaSeedNode<TType extends TypeNode = TypeNode> {
    readonly kind: 'variablePdaSeedNode';

    // Data.
    readonly name: MainCaseString;
    readonly docs: string[];

    // Children.
    readonly type: TType;
}
