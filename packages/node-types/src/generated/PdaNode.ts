import type { IdentifierString } from '../brands';
import type { PdaSeedNode } from './pdaSeedNodes/PdaSeedNode';
import type { PluginNode } from './PluginNode';
import type { TextNode } from './TextNode';

/**
 * A program-derived address: its identifier, optional program ID override, and the seeds used to derive it.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/4f7c9718-1ffa-4f2c-aa45-71b3ce204219)
 */
export interface PdaNode<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TSeeds extends Array<PdaSeedNode> | undefined = Array<PdaSeedNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'pdaNode';

    // Data.
    /** The identifier of the PDA. */
    readonly identifier: IdentifierString;
    /** The base58-encoded program ID used to derive the PDA. When omitted, the surrounding program is assumed. */
    readonly programId?: string;

    // Children.
    /** Markdown documentation for the PDA. */
    readonly docs?: TDocs;
    /** The seeds used to derive the PDA, in order. */
    readonly seeds?: TSeeds;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
