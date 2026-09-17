import type { PdaSeedValueNode, PdaValueNode, PdaValuePda, PdaValueProgramId, PluginNode } from '@codama/node-types';

import { pdaLinkNode } from '../linkNodes/PdaLinkNode';

/** Resolves to a PDA derived from a list of seed values. */
export function pdaValueNode<
    const TSeeds extends Array<PdaSeedValueNode> | undefined = [],
    const TProgramId extends PdaValueProgramId | undefined = undefined,
    const TPda extends PdaValuePda = PdaValuePda,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    pda: TPda | string,
    options: {
        seeds?: TSeeds;
        programId?: TProgramId;
        plugins?: TPlugins;
    } = {},
): PdaValueNode<TSeeds, TProgramId, TPda, TPlugins> {
    return Object.freeze({
        kind: 'pdaValueNode',

        // Children.
        pda: (typeof pda === 'string' ? pdaLinkNode(pda) : pda) as TPda,
        ...(options.seeds !== undefined && options.seeds.length > 0 && { seeds: options.seeds as TSeeds }),
        ...(options.programId !== undefined && { programId: options.programId }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
