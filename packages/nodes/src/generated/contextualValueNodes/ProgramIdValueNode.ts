import type { PluginNode, ProgramIdValueNode } from '@codama/node-types';

/** Refers to the program ID of the surrounding instruction — that is, the address of the `programNode` this node descends from. */
export function programIdValueNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    options: {
        plugins?: TPlugins;
    } = {},
): ProgramIdValueNode<TPlugins> {
    return Object.freeze({
        kind: 'programIdValueNode',

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
