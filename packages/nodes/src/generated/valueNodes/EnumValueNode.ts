import type { DefinedTypeLinkNode, EnumValueNode, EnumValuePayload, PluginNode } from '@codama/node-types';

import { identifierString } from '../../shared';
import { definedTypeLinkNode } from '../linkNodes/DefinedTypeLinkNode';

/** A concrete value of a defined enum: a variant identifier plus an optional payload. */
export function enumValueNode<
    const TEnum extends DefinedTypeLinkNode = DefinedTypeLinkNode,
    const TValue extends EnumValuePayload | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    enumLink: TEnum | string,
    variant: string,
    options: {
        value?: TValue;
        plugins?: TPlugins;
    } = {},
): EnumValueNode<TEnum, TValue, TPlugins> {
    return Object.freeze({
        kind: 'enumValueNode',

        // Data.
        variant: identifierString(variant),

        // Children.
        enum: (typeof enumLink === 'string' ? definedTypeLinkNode(enumLink) : enumLink) as TEnum,
        ...(options.value !== undefined && { value: options.value }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
