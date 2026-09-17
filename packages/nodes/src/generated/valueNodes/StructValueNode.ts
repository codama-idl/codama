import type { PluginNode, StructFieldValueNode, StructValueNode } from '@codama/node-types';

/** A concrete struct value: a list of named field values. */
export function structValueNode<
    const TFields extends Array<StructFieldValueNode> | undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    fields: TFields,
    options: {
        plugins?: TPlugins;
    } = {},
): StructValueNode<TFields, TPlugins> {
    return Object.freeze({
        kind: 'structValueNode',

        // Children.
        ...(fields !== undefined && fields.length > 0 && { fields: fields as TFields }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
