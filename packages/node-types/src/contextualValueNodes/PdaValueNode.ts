import type { PdaLinkNode } from '../linkNodes';
import type { PdaSeedValueNode } from './PdaSeedValueNode';

export interface PdaValueNode<TSeeds extends PdaSeedValueNode[] = PdaSeedValueNode[]> {
    readonly kind: 'pdaValueNode';

    // Children.
    readonly pda: PdaLinkNode;
    readonly seeds: TSeeds;
}
