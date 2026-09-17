import type { StringDisplayNode } from '../displayNodes/StringDisplayNode';
import type { PluginNode } from '../PluginNode';
import type { BytesEncoding } from '../shared/bytesEncoding';
import type { TransformNode } from '../transformNodes/TransformNode';

/**
 * A string value.
 * The encoding describes how its bytes are written.
 * The byte length is determined by a transform such as `sizePrefixTransformNode` or `fixedSizeTransformNode`.
 */
export interface StringTypeNode<
    TEncoding extends BytesEncoding = BytesEncoding,
    TDisplay extends StringDisplayNode | undefined = StringDisplayNode | undefined,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'stringTypeNode';

    // Data.
    /** The byte encoding used to serialise the string. */
    readonly encoding: TEncoding;

    // Children.
    /** Display metadata describing how the string is presented. */
    readonly display?: TDisplay;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
