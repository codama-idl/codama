import type { PdaSeedValueNode, PdaValueNode, PdaValuePda, PdaValueProgramId } from '@codama/node-types';
import { pdaLinkNode } from '../linkNodes/PdaLinkNode';

/** Resolves to a PDA derived from a list of seed values. */
export function pdaValueNode<
    const TSeeds extends Array<PdaSeedValueNode> = [],
    const TProgramId extends PdaValueProgramId | undefined = undefined,
    const TPda extends PdaValuePda = PdaValuePda,
>(
    pda: TPda | string,
    seeds: TSeeds = [] as Array<PdaSeedValueNode> as TSeeds,
    programId?: TProgramId,
): PdaValueNode<TSeeds, TProgramId, TPda> {
    return Object.freeze({
        kind: 'pdaValueNode',

        // Children.
        pda: (typeof pda === 'string' ? pdaLinkNode(pda) : pda) as TPda,
        seeds,
        ...(programId !== undefined && { programId }),
    });
}
