import type { IdentifierString } from '../brands';
import type { PluginNode } from './PluginNode';
import type { TextNode } from './TextNode';
import type { TypeNode } from './typeNodes/TypeNode';

/**
 * A reusable named type that can be referenced by `definedTypeLinkNode` from elsewhere in the IDL.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/6049cf77-9a70-4915-8276-dd571d2f8828)
 */
export interface DefinedTypeNode<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TType extends TypeNode = TypeNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'definedTypeNode';

    // Data.
    /** The identifier of the defined type. */
    readonly identifier: IdentifierString;

    // Children.
    /** Markdown documentation for the type. */
    readonly docs?: TDocs;
    /** The type definition. */
    readonly type: TType;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
