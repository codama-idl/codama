import type {
    AccountValueNode,
    ArgumentValueNode,
    PdaLinkNode,
    PdaNode,
    PdaSeedValueNode,
    PdaValueNode,
} from '@codama/node-types';

import { pdaLinkNode } from '../linkNodes';

export function pdaValueNode<
    const TSeeds extends PdaSeedValueNode[] = [],
    const TProgram extends AccountValueNode | ArgumentValueNode | undefined = undefined,
>(
    pda: PdaLinkNode | PdaNode | string,
    seeds: TSeeds = [] as PdaSeedValueNode[] as TSeeds,
    programId: TProgram = undefined as TProgram,
): PdaValueNode<TSeeds, TProgram> {
    return Object.freeze({
        kind: 'pdaValueNode',

        // Children.
        pda: typeof pda === 'string' ? pdaLinkNode(pda) : pda,
        seeds,
        ...(programId ? { programId } : {}),
    });
}
