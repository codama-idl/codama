import type { IdentifierString } from '../brands';
import type { PluginNode } from './PluginNode';
import type { TextNode } from './TextNode';

/**
 * A program error — a numeric code paired with a name and human-readable message.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/0bde98ea-0327-404b-bf38-137d105826b0)
 */
export interface ErrorNode<
    TMessage extends string | TextNode = string | TextNode,
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'errorNode';

    // Data.
    /** The identifier of the error. */
    readonly identifier: IdentifierString;
    /** The numeric error code returned by the program. */
    readonly code: number;

    // Children.
    /** A human-readable description of the error. */
    readonly message: TMessage;
    /** Markdown documentation for the error. */
    readonly docs?: TDocs;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
