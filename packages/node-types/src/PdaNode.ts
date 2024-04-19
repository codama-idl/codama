import type { PdaSeedNode } from './pdaSeedNodes';
import type { MainCaseString } from './shared';

export interface PdaNode<TSeeds extends PdaSeedNode[] = PdaSeedNode[]> {
    readonly kind: 'pdaNode';

    // Data.
    readonly name: MainCaseString;

    // Children.
    readonly seeds: TSeeds;
}
