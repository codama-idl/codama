import type { BytesEncoding, BytesValueNode, PluginNode } from '@codama/node-types';

/** A concrete bytes value, encoded as text in the chosen encoding. */
export function bytesValueNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    encoding: BytesEncoding,
    data: string,
    options: {
        plugins?: TPlugins;
    } = {},
): BytesValueNode<TPlugins> {
    return Object.freeze({
        kind: 'bytesValueNode',

        // Data.
        data,
        encoding,

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
