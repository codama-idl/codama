import type { IdentifierString } from '../../brands';
import type { PluginNode } from '../PluginNode';

/** A reference to a program by name. */
export interface ProgramLinkNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'programLinkNode';

    // Data.
    /** The identifier of the referenced program. */
    readonly identifier: IdentifierString;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
