import type { PdaLinkNode } from '../linkNodes';
import type { PdaNode } from '../PdaNode';
import type { AccountValueNode } from './AccountValueNode';
import type { ArgumentValueNode } from './ArgumentValueNode';
import type { PdaSeedValueNode } from './PdaSeedValueNode';

export interface PdaValueNode<
    TSeeds extends PdaSeedValueNode[] = PdaSeedValueNode[],
    TProgram extends AccountValueNode | ArgumentValueNode | undefined =
        | AccountValueNode
        | ArgumentValueNode
        | undefined,
> {
    readonly kind: 'pdaValueNode';

    // Children.
    readonly pda: PdaLinkNode | PdaNode;
    readonly seeds: TSeeds;
    readonly programId?: TProgram;
}
