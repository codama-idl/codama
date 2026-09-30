import type { ConstantValueNode, PluginNode, TypeNode, ValueNode } from '@codama/node-types';

/** A typed constant: a type node paired with a concrete value node. */
export function constantValueNode<
    const TType extends TypeNode,
    const TValue extends ValueNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    type: TType,
    value: TValue,
    options: {
        plugins?: TPlugins;
    } = {},
): ConstantValueNode<TType, TValue, TPlugins> {
    return Object.freeze({
        kind: 'constantValueNode',

        // Children.
        type,
        value,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
