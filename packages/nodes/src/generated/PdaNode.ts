import type { PdaNode, PdaSeedNode } from '@codama/node-types';
import { camelCase, DocsInput, parseDocs } from '../shared';

export type PdaNodeInput<TSeeds extends Array<PdaSeedNode> = Array<PdaSeedNode>> = Omit<
    PdaNode<TSeeds>,
    'docs' | 'kind' | 'name'
> & {
    readonly name: string;
    readonly docs?: DocsInput;
};

/** A program-derived address: its name, optional program ID override, and the seeds used to derive it. */
export function pdaNode<const TSeeds extends Array<PdaSeedNode>>(input: PdaNodeInput<TSeeds>): PdaNode<TSeeds> {
    const parsedDocs = parseDocs(input.docs);
    return Object.freeze({
        kind: 'pdaNode',

        // Data.
        name: camelCase(input.name),
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),
        ...(input.programId !== undefined && { programId: input.programId }),

        // Children.
        seeds: input.seeds,
    });
}
