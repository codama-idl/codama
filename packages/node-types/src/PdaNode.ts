import type { PdaSeedNode } from './pdaSeedNodes';
import type { CamelCaseString, Docs } from './shared';

export interface PdaNode<TSeeds extends PdaSeedNode[] = PdaSeedNode[]> {
    readonly kind: 'pdaNode';

    // Data.
    readonly name: CamelCaseString;
    readonly docs?: Docs;
    readonly programId?: string;

    // Children.
    readonly seeds: TSeeds;
}
