import type { ErrorNode, PluginNode, TextNode } from '@codama/node-types';

import { identifierString } from '../shared';

export type ErrorNodeInput<
    TMessage extends string | TextNode = string | TextNode,
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<ErrorNode<TMessage, TDocs, TPlugins>, 'identifier' | 'kind'> & {
    readonly identifier: string;
};

/**
 * A program error — a numeric code paired with a name and human-readable message.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/0bde98ea-0327-404b-bf38-137d105826b0)
 */
export function errorNode<
    const TMessage extends string | TextNode,
    const TDocs extends string | TextNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(input: ErrorNodeInput<TMessage, TDocs, TPlugins>): ErrorNode<TMessage, TDocs, TPlugins> {
    return Object.freeze({
        kind: 'errorNode',

        // Data.
        identifier: identifierString(input.identifier),
        code: input.code,

        // Children.
        message: input.message,
        ...(input.docs !== undefined && { docs: input.docs }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
