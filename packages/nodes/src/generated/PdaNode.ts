import type { PdaNode, PdaSeedNode } from '@codama/node-types';

import { camelCase, DocsInput, parseDocs } from '../shared';

export type PdaNodeInput<TSeeds extends Array<PdaSeedNode> | undefined = Array<PdaSeedNode> | undefined> = Omit<
    PdaNode<TSeeds>,
    'docs' | 'kind' | 'name'
> & {
    readonly name: string;
    readonly docs?: DocsInput;
};

/**
 * A program-derived address: its name, optional program ID override, and the seeds used to derive it.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/4f7c9718-1ffa-4f2c-aa45-71b3ce204219)
 */
export function pdaNode<const TSeeds extends Array<PdaSeedNode> | undefined>(
    input: PdaNodeInput<TSeeds>,
): PdaNode<TSeeds> {
    const parsedDocs = parseDocs(input.docs);
    return Object.freeze({
        kind: 'pdaNode',

        // Data.
        name: camelCase(input.name),
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),
        ...(input.programId !== undefined && { programId: input.programId }),

        // Children.
        ...(input.seeds !== undefined && input.seeds.length > 0 && { seeds: input.seeds as TSeeds }),
    });
}
