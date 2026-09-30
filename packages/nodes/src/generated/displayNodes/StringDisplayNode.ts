import type { PluginNode, StringDisplayNode } from '@codama/node-types';

export type StringDisplayNodeInput<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> =
    Omit<StringDisplayNode<TPlugins>, 'kind'>;

/**
 * Display metadata for a string value.
 * The string's wire encoding is carried by `stringTypeNode.encoding`; this node only addresses presentation.
 */
export function stringDisplayNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    input: StringDisplayNodeInput<TPlugins>,
): StringDisplayNode<TPlugins> {
    return Object.freeze({
        kind: 'stringDisplayNode',

        // Data.
        ...(input.sliceStart !== undefined && { sliceStart: input.sliceStart }),
        ...(input.sliceEnd !== undefined && { sliceEnd: input.sliceEnd }),

        // Children.
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
