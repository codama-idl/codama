import type { EnumVariantDisplayNode, EnumVariantTypeNode, PluginNode, TextNode, TypeNode } from '@codama/node-types';

import { identifierString } from '../../shared';

/**
 * A named variant of an enum, with an optional data payload.
 * Absent `data` is a unit variant; a struct payload gives named fields, a tuple payload gives positional fields, and any other type node is carried as-is — a variant holding a single type needs no tuple around it.
 */
export function enumVariantTypeNode<
    const TDocs extends string | TextNode | undefined = undefined,
    const TData extends TypeNode | undefined = undefined,
    const TDisplay extends EnumVariantDisplayNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    identifier: string,
    options: {
        discriminator?: number;
        docs?: TDocs;
        data?: TData;
        display?: TDisplay;
        plugins?: TPlugins;
    } = {},
): EnumVariantTypeNode<TDocs, TData, TDisplay, TPlugins> {
    return Object.freeze({
        kind: 'enumVariantTypeNode',

        // Data.
        identifier: identifierString(identifier),
        ...(options.discriminator !== undefined && { discriminator: options.discriminator }),

        // Children.
        ...(options.docs !== undefined && { docs: options.docs }),
        ...(options.data !== undefined && { data: options.data }),
        ...(options.display !== undefined && { display: options.display }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
