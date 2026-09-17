import type { PluginNode, StructFieldDisplayNode, TextNode } from '@codama/node-types';

export type StructFieldDisplayNodeInput<
    TLabel extends string | TextNode | undefined = string | TextNode | undefined,
    TFlattenPrefix extends string | TextNode | undefined = string | TextNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<StructFieldDisplayNode<TLabel, TFlattenPrefix, TPlugins>, 'kind'>;

/**
 * Display metadata for a named member: its label, whether it is shown in the fallback list, and whether it is flattened into its parent.
 * Value presentation is carried by the member's type; this node only addresses naming and composition.
 */
export function structFieldDisplayNode<
    const TLabel extends string | TextNode | undefined = undefined,
    const TFlattenPrefix extends string | TextNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    input: StructFieldDisplayNodeInput<TLabel, TFlattenPrefix, TPlugins>,
): StructFieldDisplayNode<TLabel, TFlattenPrefix, TPlugins> {
    return Object.freeze({
        kind: 'structFieldDisplayNode',

        // Data.
        ...(input.skip !== undefined && { skip: input.skip }),
        ...(input.flatten !== undefined && { flatten: input.flatten }),

        // Children.
        ...(input.label !== undefined && { label: input.label }),
        ...(input.flattenPrefix !== undefined && { flattenPrefix: input.flattenPrefix }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
