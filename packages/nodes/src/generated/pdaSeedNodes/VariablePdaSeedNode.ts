import type { PluginNode, TextNode, TypeNode, VariablePdaSeedNode } from '@codama/node-types';

import { identifierString } from '../../shared';

/** A PDA seed whose value is provided at derivation time, identified by name. */
export function variablePdaSeedNode<
    const TDocs extends string | TextNode | undefined = undefined,
    const TType extends TypeNode = TypeNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    identifier: string,
    type: TType,
    options: {
        docs?: TDocs;
        plugins?: TPlugins;
    } = {},
): VariablePdaSeedNode<TDocs, TType, TPlugins> {
    return Object.freeze({
        kind: 'variablePdaSeedNode',

        // Data.
        identifier: identifierString(identifier),

        // Children.
        ...(options.docs !== undefined && { docs: options.docs }),
        type,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
