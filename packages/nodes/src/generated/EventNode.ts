import type { DiscriminatorNode, EventNode, TypeNode } from '@codama/node-types';
import { camelCase, DocsInput, parseDocs } from '../shared';

export type EventNodeInput<
    TData extends TypeNode = TypeNode,
    TDiscriminators extends Array<DiscriminatorNode> | undefined = Array<DiscriminatorNode> | undefined,
> = Omit<EventNode<TData, TDiscriminators>, 'docs' | 'kind' | 'name'> & {
    readonly name: string;
    readonly docs?: DocsInput;
};

/** A program event: its data shape and optional discriminators used to identify it on the wire. */
export function eventNode<
    const TData extends TypeNode,
    const TDiscriminators extends Array<DiscriminatorNode> | undefined = undefined,
>(input: EventNodeInput<TData, TDiscriminators>): EventNode<TData, TDiscriminators> {
    const parsedDocs = parseDocs(input.docs);
    return Object.freeze({
        kind: 'eventNode',

        // Data.
        name: camelCase(input.name),
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),

        // Children.
        data: input.data,
        ...(input.discriminators !== undefined &&
            input.discriminators.length > 0 && { discriminators: input.discriminators as TDiscriminators }),
    });
}
