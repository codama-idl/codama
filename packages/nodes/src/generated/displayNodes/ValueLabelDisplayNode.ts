import type { PluginNode, TextNode, ValueLabelDisplayNode, ValueNode } from '@codama/node-types';

export type ValueLabelDisplayNodeInput<
    TValue extends ValueNode = ValueNode,
    TLabel extends string | TextNode = string | TextNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<ValueLabelDisplayNode<TValue, TLabel, TPlugins>, 'kind'>;

/**
 * A label presented instead of a specific value, e.g. `"All"` for an amount of `u64::MAX` or `"Never expires"` for an absent expiry.
 * Listed in a `structFieldDisplayNode`'s `valueLabels`; it is not part of any `display` slot on its own.
 */
export function valueLabelDisplayNode<
    const TValue extends ValueNode,
    const TLabel extends string | TextNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(input: ValueLabelDisplayNodeInput<TValue, TLabel, TPlugins>): ValueLabelDisplayNode<TValue, TLabel, TPlugins> {
    return Object.freeze({
        kind: 'valueLabelDisplayNode',

        // Children.
        value: input.value,
        label: input.label,
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
