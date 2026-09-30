import type { EnumVariantDisplayNode, PluginNode, TextNode } from '@codama/node-types';

export type EnumVariantDisplayNodeInput<
    TLabel extends string | TextNode | undefined = string | TextNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<EnumVariantDisplayNode<TLabel, TPlugins>, 'kind'>;

/** Display metadata for an enum variant: its label and whether to hide its inner payload. */
export function enumVariantDisplayNode<
    const TLabel extends string | TextNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(input: EnumVariantDisplayNodeInput<TLabel, TPlugins>): EnumVariantDisplayNode<TLabel, TPlugins> {
    return Object.freeze({
        kind: 'enumVariantDisplayNode',

        // Data.
        ...(input.skipInnerData !== undefined && { skipInnerData: input.skipInnerData }),

        // Children.
        ...(input.label !== undefined && { label: input.label }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
