import type { IdentifierString } from '../../brands';
import type { PluginNode } from '../PluginNode';
import type { TextNode } from '../TextNode';
import type { TypeNode } from '../typeNodes/TypeNode';

/** A PDA seed whose value is provided at derivation time, identified by name. */
export interface VariablePdaSeedNode<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TType extends TypeNode = TypeNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'variablePdaSeedNode';

    // Data.
    /** The identifier of the seed variable. */
    readonly identifier: IdentifierString;

    // Children.
    /** Markdown documentation for the seed variable. */
    readonly docs?: TDocs;
    /** The expected type of the seed value. */
    readonly type: TType;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
