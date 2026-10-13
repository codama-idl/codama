import type { PluginNode } from '../PluginNode';
import type { TextNode } from '../TextNode';
import type { ValueNode } from '../valueNodes/ValueNode';

/**
 * A label presented instead of a specific value, e.g. `"All"` for an amount of `u64::MAX` or `"Never expires"` for an absent expiry.
 * Listed in a `structFieldDisplayNode`'s `valueLabels`; it is not part of any `display` slot on its own.
 */
export interface ValueLabelDisplayNode<
    TValue extends ValueNode = ValueNode,
    TLabel extends string | TextNode = string | TextNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'valueLabelDisplayNode';

    // Children.
    /**
     * The value to label, matched structurally against the field's raw decoded value, before any display formatting, e.g. `integerValueNode('18446744073709551615')` or `noneValueNode()`.
     * It must be a concrete value of the field's type: injected values are not resolved here.
     */
    readonly value: TValue;
    /**
     * The label presented instead of the value, both in the fallback list and in interpolated intents (e.g. `"all SOL"`).
     * Since the same label serves both, prefer wording that reads well as a field value and mid-sentence.
     */
    readonly label: TLabel;
    /** Namespaced plugins with custom structured data. */
    readonly plugins?: TPlugins;
}
