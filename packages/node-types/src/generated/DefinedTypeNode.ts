import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';
import type { TypeNode } from './typeNodes/TypeNode';

/** A reusable named type that can be referenced by `definedTypeLinkNode` from elsewhere in the IDL. */
export interface DefinedTypeNode<TType extends TypeNode = TypeNode> {
    readonly kind: 'definedTypeNode';

    // Data.
    /** The name of the defined type. */
    readonly name: CamelCaseString;
    /** Markdown documentation for the type. */
    readonly docs?: Docs;

    // Children.
    /** The type definition. */
    readonly type: TType;
}
