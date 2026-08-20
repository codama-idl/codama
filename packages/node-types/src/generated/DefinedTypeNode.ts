import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';
import type { TypeNode } from './typeNodes/TypeNode';

/**
 * A reusable named type that can be referenced by `definedTypeLinkNode` from elsewhere in the IDL.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/6049cf77-9a70-4915-8276-dd571d2f8828)
 */
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
