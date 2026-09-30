import type { DiscriminatorNode, EventNode, PluginNode, TextNode, TypeNode } from '@codama/node-types';

import { identifierString } from '../shared';

export type EventNodeInput<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TData extends TypeNode = TypeNode,
    TDiscriminators extends Array<DiscriminatorNode> | undefined = Array<DiscriminatorNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<EventNode<TDocs, TData, TDiscriminators, TPlugins>, 'identifier' | 'kind'> & {
    readonly identifier: string;
};

/** A program event: its data shape and optional discriminators used to identify it on the wire. */
export function eventNode<
    const TDocs extends string | TextNode | undefined = undefined,
    const TData extends TypeNode = TypeNode,
    const TDiscriminators extends Array<DiscriminatorNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(input: EventNodeInput<TDocs, TData, TDiscriminators, TPlugins>): EventNode<TDocs, TData, TDiscriminators, TPlugins> {
    return Object.freeze({
        kind: 'eventNode',

        // Data.
        identifier: identifierString(input.identifier),

        // Children.
        ...(input.docs !== undefined && { docs: input.docs }),
        data: input.data,
        ...(input.discriminators !== undefined &&
            input.discriminators.length > 0 && { discriminators: input.discriminators as TDiscriminators }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
