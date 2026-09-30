import type { IdentifierString } from '../brands';
import type { PluginNode } from './PluginNode';
import type { TextNode } from './TextNode';
import type { TypeNode } from './typeNodes/TypeNode';
import type { ValueNode } from './valueNodes/ValueNode';

/** A named constant exposed by the program: a typed value associated with a name. */
export interface ConstantNode<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TType extends TypeNode = TypeNode,
    TValue extends ValueNode = ValueNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'constantNode';

    // Data.
    /** The identifier of the constant. */
    readonly identifier: IdentifierString;

    // Children.
    /** Markdown documentation for the constant. */
    readonly docs?: TDocs;
    /** The type of the constant. */
    readonly type: TType;
    /** The concrete value of the constant. */
    readonly value: TValue;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
