import type { PluginNode } from '../PluginNode';
import type { DisplaySkip } from '../shared/displaySkip';
import type { TextNode } from '../TextNode';

/** Display metadata for an instruction account: its label in the fallback list and whether it is shown. */
export interface InstructionAccountDisplayNode<
    TLabel extends string | TextNode | undefined = string | TextNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'instructionAccountDisplayNode';

    // Data.
    /** Whether the account is shown in the fallback list. Defaults to `"never"` (always shown). */
    readonly skip?: DisplaySkip;

    // Children.
    /**
     * An override label shown in the fallback list (e.g. `"To"`).
     * When absent, renderers derive a label from the account `name`.
     */
    readonly label?: TLabel;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
