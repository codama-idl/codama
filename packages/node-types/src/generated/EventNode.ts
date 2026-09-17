import type { IdentifierString } from '../brands';
import type { DiscriminatorNode } from './discriminatorNodes/DiscriminatorNode';
import type { PluginNode } from './PluginNode';
import type { TextNode } from './TextNode';
import type { TypeNode } from './typeNodes/TypeNode';

/** A program event: its data shape and optional discriminators used to identify it on the wire. */
export interface EventNode<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TData extends TypeNode = TypeNode,
    TDiscriminators extends Array<DiscriminatorNode> | undefined = Array<DiscriminatorNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'eventNode';

    // Data.
    /** The identifier of the event. */
    readonly identifier: IdentifierString;

    // Children.
    /** Markdown documentation for the event. */
    readonly docs?: TDocs;
    /** The type describing the event payload. */
    readonly data: TData;
    /** Discriminators that distinguish this event from others. When multiple are listed, they are combined with a logical AND. */
    readonly discriminators?: TDiscriminators;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
