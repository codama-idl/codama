import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';
import type { ConstantValueNode } from '../valueNodes/ConstantValueNode';
import type { TypeNode } from './TypeNode';

/** An optional value whose absence is signalled by a designated zero value rather than a presence flag. */
export interface ZeroableOptionTypeNode<
    TItem extends TypeNode = TypeNode,
    TZeroValue extends ConstantValueNode | undefined = ConstantValueNode | undefined,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'zeroableOptionTypeNode';

    // Children.
    /** The type carried by the option when present. Must be of fixed size. */
    readonly item: TItem;
    /** The constant value that signals absence. When omitted, the all-zero byte pattern of the item type is used. */
    readonly zeroValue?: TZeroValue;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
