import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';
import type { PdaSeedNode } from './pdaSeedNodes/PdaSeedNode';

/**
 * A program-derived address: its name, optional program ID override, and the seeds used to derive it.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/4f7c9718-1ffa-4f2c-aa45-71b3ce204219)
 */
export interface PdaNode<TSeeds extends Array<PdaSeedNode> | undefined = Array<PdaSeedNode> | undefined> {
    readonly kind: 'pdaNode';

    // Data.
    /** The name of the PDA. */
    readonly name: CamelCaseString;
    /** Markdown documentation for the PDA. */
    readonly docs?: Docs;
    /** The base58-encoded program ID used to derive the PDA. When omitted, the surrounding program is assumed. */
    readonly programId?: string;

    // Children.
    /** The seeds used to derive the PDA, in order. */
    readonly seeds?: TSeeds;
}
