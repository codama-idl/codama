import type { PdaNode, PdaSeedNode, PluginNode, TextNode } from '@codama/node-types';

import { identifierString } from '../shared';

export type PdaNodeInput<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TSeeds extends Array<PdaSeedNode> | undefined = Array<PdaSeedNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<PdaNode<TDocs, TSeeds, TPlugins>, 'identifier' | 'kind'> & {
    readonly identifier: string;
};

/**
 * A program-derived address: its identifier, optional program ID override, and the seeds used to derive it.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/4f7c9718-1ffa-4f2c-aa45-71b3ce204219)
 */
export function pdaNode<
    const TDocs extends string | TextNode | undefined = undefined,
    const TSeeds extends Array<PdaSeedNode> | undefined = Array<PdaSeedNode> | undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(input: PdaNodeInput<TDocs, TSeeds, TPlugins>): PdaNode<TDocs, TSeeds, TPlugins> {
    return Object.freeze({
        kind: 'pdaNode',

        // Data.
        identifier: identifierString(input.identifier),
        ...(input.programId !== undefined && { programId: input.programId }),

        // Children.
        ...(input.docs !== undefined && { docs: input.docs }),
        ...(input.seeds !== undefined && input.seeds.length > 0 && { seeds: input.seeds as TSeeds }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
