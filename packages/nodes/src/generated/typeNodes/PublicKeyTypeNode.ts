import type { PluginNode, PublicKeyTypeNode, TransformNode } from '@codama/node-types';

/** A 32-byte Solana public key. */
export function publicKeyTypeNode<
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    options: {
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): PublicKeyTypeNode<TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'publicKeyTypeNode',

        // Children.
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
