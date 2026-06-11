import type { CamelCaseString } from '../../brands';
import type { Docs } from '../../Docs';
import type { TypeNode } from '../typeNodes/TypeNode';

/** A PDA seed whose value is provided at derivation time, identified by name. */
export interface VariablePdaSeedNode<TType extends TypeNode = TypeNode> {
    readonly kind: 'variablePdaSeedNode';

    // Data.
    /** The name of the seed variable. */
    readonly name: CamelCaseString;
    /** Markdown documentation for the seed variable. */
    readonly docs?: Docs;

    // Children.
    /** The expected type of the seed value. */
    readonly type: TType;
}
