import type { PdaLinkNode } from '../linkNodes';
import type { PdaNode } from '../PdaNode';
import type { PdaSeedValueNode } from './PdaSeedValueNode';

export interface PdaValueNode<TSeeds extends PdaSeedValueNode[] = PdaSeedValueNode[]> {
    readonly kind: 'pdaValueNode';

    // Children.
    readonly pda: PdaLinkNode | PdaNode;
    readonly seeds: TSeeds;
}
