import type { PdaNode, PdaSeedNode } from '@kinobi-so/node-types';

import { camelCase, DocsInput, parseDocs } from './shared';

export type PdaNodeInput<TSeeds extends PdaSeedNode[] = PdaSeedNode[]> = Omit<
    PdaNode<TSeeds>,
    'docs' | 'kind' | 'name'
> & {
    readonly docs?: DocsInput;
    readonly name: string;
};

export function pdaNode<const TSeeds extends PdaSeedNode[]>(input: PdaNodeInput<TSeeds>): PdaNode<TSeeds> {
    if (!input.name) {
        // TODO: Coded error.
        throw new Error('PdaNode must have a name.');
    }

    return Object.freeze({
        kind: 'pdaNode',

        // Data.
        name: camelCase(input.name),
        docs: parseDocs(input.docs),

        // Children.
        seeds: input.seeds,
    });
}
