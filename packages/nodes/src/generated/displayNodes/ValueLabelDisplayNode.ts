import type { PluginNode, TextNode, ValueLabelDisplayNode, ValueNode } from '@codama/node-types';

export type ValueLabelDisplayNodeInput<
    TLabel extends string | TextNode = string | TextNode,
    TValue extends ValueNode = ValueNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<ValueLabelDisplayNode<TLabel, TValue, TPlugins>, 'kind'>;

/**
 * A label presented instead of a specific value, e.g. `"All"` for an amount of `u64::MAX` or `"Never expires"` for an absent expiry.
 * Listed in a `structFieldDisplayNode`'s `valueLabels`; it is not part of any `display` slot on its own.
 */
export function valueLabelDisplayNode<
    const TLabel extends string | TextNode,
    const TValue extends ValueNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(input: ValueLabelDisplayNodeInput<TLabel, TValue, TPlugins>): ValueLabelDisplayNode<TLabel, TValue, TPlugins> {
    return Object.freeze({
        kind: 'valueLabelDisplayNode',

        label: input.label,
        value: input.value,
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
