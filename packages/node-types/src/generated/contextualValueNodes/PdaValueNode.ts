import type { PluginNode } from '../PluginNode';
import type { PdaSeedValueNode } from './PdaSeedValueNode';
import type { PdaValuePda } from './PdaValuePda';
import type { PdaValueProgramId } from './PdaValueProgramId';

/** Resolves to a PDA derived from a list of seed values. */
export interface PdaValueNode<
    TSeeds extends Array<PdaSeedValueNode> | undefined = Array<PdaSeedValueNode> | undefined,
    TProgramId extends PdaValueProgramId | undefined = PdaValueProgramId | undefined,
    TPda extends PdaValuePda = PdaValuePda,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'pdaValueNode';

    // Children.
    /** The PDA being derived — either a link to a defined PDA or an inline `pdaNode`. */
    readonly pda: TPda;
    /** The seed values used to derive the PDA, paired with their seed names. */
    readonly seeds?: TSeeds;
    /** The program ID used to derive the PDA. When omitted, the PDA’s declared program is used. */
    readonly programId?: TProgramId;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
