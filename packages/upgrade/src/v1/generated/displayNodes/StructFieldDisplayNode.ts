import type { DisplaySkip } from '../shared/displaySkip';

/**
 * Display metadata for a named member: its label, whether it is shown in the fallback list, and whether it is flattened into its parent.
 * Value presentation is carried by the member's type; this node only addresses naming and composition.
 */
export interface StructFieldDisplayNode {
    readonly kind: 'structFieldDisplayNode';

    // Data.
    /**
     * An override label shown for the member (e.g. `"Amount"`).
     * When absent, renderers derive a label from the member `name`.
     */
    readonly label?: string;
    /** Whether the member is shown in the fallback list. Defaults to `"never"` (always shown). */
    readonly skip?: DisplaySkip;
    /**
     * When `true`, the member's type is expected to be a struct and its fields are lifted into the parent's context, dropping the field name as an extra level of nesting.
     * Flattening lives on the field rather than on the struct so the same struct can be flattened in one place and nested in another.
     * Meaningful only when the member's type is structurally a struct; renderers ignore it otherwise.
     */
    readonly flatten?: boolean;
    /**
     * A literal prefix prepended to each flattened member's label (e.g. `"args."`).
     * Meaningful only when `flatten` is `true`. Useful to disambiguate when two flattened children might collide.
     */
    readonly flattenPrefix?: string;
}
