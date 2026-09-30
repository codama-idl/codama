import type { IdentifierString } from '../../brands';
import type { PluginNode } from '../PluginNode';
import type { ProgramLinkNode } from './ProgramLinkNode';

/** A reference to an instruction defined elsewhere — possibly in a different program. */
export interface InstructionLinkNode<
    TProgram extends ProgramLinkNode | undefined = ProgramLinkNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'instructionLinkNode';

    // Data.
    /** The identifier of the referenced instruction. */
    readonly identifier: IdentifierString;

    // Children.
    /** The program the referenced instruction belongs to. When omitted, the surrounding program is assumed. */
    readonly program?: TProgram;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
