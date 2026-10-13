import type { PluginNode } from '../PluginNode';
import type { DisplaySkip } from '../shared/displaySkip';
import type { TextNode } from '../TextNode';
import type { ValueLabelDisplayNode } from './ValueLabelDisplayNode';

/**
 * Display metadata for a named member: its label, whether it is shown in the fallback list, whether it is flattened into its parent, and labels for specific values.
 * Value presentation is otherwise carried by the member's type; this node addresses naming and composition, and value labels override the presentation of the values they match.
 */
export interface StructFieldDisplayNode<
    TLabel extends string | TextNode | undefined = string | TextNode | undefined,
    TFlattenPrefix extends string | TextNode | undefined = string | TextNode | undefined,
    TValueLabels extends Array<ValueLabelDisplayNode> | undefined = Array<ValueLabelDisplayNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'structFieldDisplayNode';

    // Data.
    /** Whether the member is shown in the fallback list. Defaults to `"never"` (always shown). */
    readonly skip?: DisplaySkip;
    /**
     * When `true`, the member's type is expected to be a struct and its fields are lifted into the parent's context, dropping the field name as an extra level of nesting.
     * Flattening lives on the field rather than on the struct so the same struct can be flattened in one place and nested in another.
     * Meaningful only when the member's type is structurally a struct; renderers ignore it otherwise.
     */
    readonly flatten?: boolean;

    // Children.
    /**
     * An override label shown for the member (e.g. `"Amount"`).
     * When absent, renderers derive a label from the member `identifier`.
     */
    readonly label?: TLabel;
    /**
     * A literal prefix prepended to each flattened member's label (e.g. `"args."`).
     * Meaningful only when `flatten` is `true`. Useful to disambiguate when two flattened children might collide.
     */
    readonly flattenPrefix?: TFlattenPrefix;
    /**
     * Labels presented instead of specific values of the member, e.g. `"All"` for `u64::MAX`. When the member's raw decoded value, before any display formatting, matches a label's `value` structurally, renderers present the label instead of the formatted value, including in interpolated intents.
     * When several labels match, the first one wins. A matching label is presented as the member's single value, even when `flatten` is `true`.
     */
    readonly valueLabels?: TValueLabels;
    /** Namespaced plugins with custom structured data. */
    readonly plugins?: TPlugins;
}
