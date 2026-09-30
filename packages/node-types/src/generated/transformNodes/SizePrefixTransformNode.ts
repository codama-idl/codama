import type { PluginNode } from '../PluginNode';
import type { IntegerTypeNode } from '../typeNodes/IntegerTypeNode';

/**
 * Precedes the transformed type with a numeric prefix indicating its byte length.
 * When decoding, the size is read first and determines how many bytes the transformed type may consume.
 */
export interface SizePrefixTransformNode<
    TPrefix extends IntegerTypeNode = IntegerTypeNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'sizePrefixTransformNode';

    // Children.
    /** The integer type used as the size prefix. */
    readonly prefix: TPrefix;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
