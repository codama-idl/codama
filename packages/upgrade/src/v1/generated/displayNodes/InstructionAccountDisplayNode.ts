import type { DisplaySkip } from '../shared/displaySkip';

/** Display metadata for an instruction account: its label in the fallback list and whether it is shown. */
export interface InstructionAccountDisplayNode {
    readonly kind: 'instructionAccountDisplayNode';

    // Data.
    /**
     * An override label shown in the fallback list (e.g. `"To"`).
     * When absent, renderers derive a label from the account `name`.
     */
    readonly label?: string;
    /** Whether the account is shown in the fallback list. Defaults to `"never"` (always shown). */
    readonly skip?: DisplaySkip;
}
