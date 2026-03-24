import type { DiscriminatorNode, EventNode, TypeNode } from '@codama/node-types';

import { camelCase, DocsInput, parseDocs } from './shared';
import { structTypeNode } from './typeNodes';

export type EventNodeInput<
    TData extends TypeNode = TypeNode,
    TDiscriminators extends DiscriminatorNode[] | undefined = DiscriminatorNode[] | undefined,
> = Omit<EventNode<TData, TDiscriminators>, 'data' | 'docs' | 'kind' | 'name'> & {
    readonly data: TData;
    readonly docs?: DocsInput;
    readonly name: string;
};

export function eventNode<
    TData extends TypeNode = ReturnType<typeof structTypeNode>,
    const TDiscriminators extends DiscriminatorNode[] | undefined = undefined,
>(input: EventNodeInput<TData, TDiscriminators>): EventNode<TData, TDiscriminators> {
    return Object.freeze({
        kind: 'eventNode',

        // Data.
        name: camelCase(input.name),
        ...(input.size === undefined ? {} : { size: input.size }),
        docs: parseDocs(input.docs),

        // Children.
        data: input.data,
        ...(input.discriminators !== undefined && { discriminators: input.discriminators }),
    });
}
