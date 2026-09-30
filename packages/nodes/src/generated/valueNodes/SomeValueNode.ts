import type { PluginNode, SomeValueNode, ValueNode } from '@codama/node-types';

/**
 * The "present" value for an optional type, wrapping a concrete value node.
 * For instance, this can be set as the default value of a field whose type is an `optionTypeNode`.
 */
export function someValueNode<
    const TValue extends ValueNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    value: TValue,
    options: {
        plugins?: TPlugins;
    } = {},
): SomeValueNode<TValue, TPlugins> {
    return Object.freeze({
        kind: 'someValueNode',

        // Children.
        value,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
