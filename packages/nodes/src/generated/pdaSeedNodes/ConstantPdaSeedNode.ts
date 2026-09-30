import type { ConstantPdaSeedNode, ConstantPdaSeedValue, PluginNode, TypeNode } from '@codama/node-types';

/** A PDA seed with a constant value (e.g. a UTF-8 string or a fixed byte sequence). */
export function constantPdaSeedNode<
    const TType extends TypeNode,
    const TValue extends ConstantPdaSeedValue,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    type: TType,
    value: TValue,
    options: {
        plugins?: TPlugins;
    } = {},
): ConstantPdaSeedNode<TType, TValue, TPlugins> {
    return Object.freeze({
        kind: 'constantPdaSeedNode',

        // Children.
        type,
        value,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
