import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';
import type { IntegerTypeNode } from './IntegerTypeNode';
import type { TypeNode } from './TypeNode';

/** A value that may be present or absent (Some/None), with an explicit numeric prefix indicating presence. */
export interface OptionTypeNode<
    TItem extends TypeNode = TypeNode,
    TPrefix extends IntegerTypeNode = IntegerTypeNode,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'optionTypeNode';

    // Data.
    /**
     * When `true`, the absent variant still occupies the byte size of the present variant (zero-padded). Defaults to `false`.
     * Must only be set to `true` when the `item` type is of fixed size.
     */
    readonly fixed?: boolean;

    // Children.
    /** The type carried by the option when present. */
    readonly item: TItem;
    /**
     * The integer type used as the presence flag.
     * A prefix value of `1` means the item is present and follows the prefix; a value of `0` means the item is absent and nothing further is serialised.
     */
    readonly prefix: TPrefix;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
