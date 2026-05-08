import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';
import type { PdaSeedNode } from './pdaSeedNodes/PdaSeedNode';

/** A program-derived address: its name, optional program ID override, and the seeds used to derive it. */
export interface PdaNode<TSeeds extends Array<PdaSeedNode> = Array<PdaSeedNode>> {
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
    readonly seeds: TSeeds;
}
