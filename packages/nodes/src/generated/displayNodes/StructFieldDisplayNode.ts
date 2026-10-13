import type { PluginNode, StructFieldDisplayNode, TextNode, ValueLabelDisplayNode } from '@codama/node-types';

export type StructFieldDisplayNodeInput<
    TLabel extends string | TextNode | undefined = string | TextNode | undefined,
    TFlattenPrefix extends string | TextNode | undefined = string | TextNode | undefined,
    TValueLabels extends Array<ValueLabelDisplayNode> | undefined = Array<ValueLabelDisplayNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<StructFieldDisplayNode<TLabel, TFlattenPrefix, TValueLabels, TPlugins>, 'kind'>;

/**
 * Display metadata for a named member: its label, whether it is shown in the fallback list, whether it is flattened into its parent, and labels for specific values.
 * Value presentation is otherwise carried by the member's type; this node addresses naming and composition, and value labels override the presentation of the values they match.
 */
export function structFieldDisplayNode<
    const TLabel extends string | TextNode | undefined = undefined,
    const TFlattenPrefix extends string | TextNode | undefined = undefined,
    const TValueLabels extends Array<ValueLabelDisplayNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    input: StructFieldDisplayNodeInput<TLabel, TFlattenPrefix, TValueLabels, TPlugins>,
): StructFieldDisplayNode<TLabel, TFlattenPrefix, TValueLabels, TPlugins> {
    return Object.freeze({
        kind: 'structFieldDisplayNode',

        // Data.
        ...(input.skip !== undefined && { skip: input.skip }),
        ...(input.flatten !== undefined && { flatten: input.flatten }),

        // Children.
        ...(input.label !== undefined && { label: input.label }),
        ...(input.flattenPrefix !== undefined && { flattenPrefix: input.flattenPrefix }),
        ...(input.valueLabels !== undefined &&
            input.valueLabels.length > 0 && { valueLabels: input.valueLabels as TValueLabels }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
