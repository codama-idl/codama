import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';
import type { StructFieldTypeNode } from './StructFieldTypeNode';

/** A composite type made of an ordered list of named fields. Fields are encoded and decoded in declaration order. */
export interface StructTypeNode<
    TFields extends Array<StructFieldTypeNode> | undefined = Array<StructFieldTypeNode> | undefined,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'structTypeNode';

    // Children.
    /** The fields of the struct, in declaration order. */
    readonly fields?: TFields;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
