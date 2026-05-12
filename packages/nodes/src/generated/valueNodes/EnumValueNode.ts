import type { DefinedTypeLinkNode, EnumValueNode, EnumValuePayload } from '@codama/node-types';
import { camelCase } from '../../shared';
import { definedTypeLinkNode } from '../linkNodes/DefinedTypeLinkNode';

/** A concrete value of a defined enum: a variant identifier plus an optional payload. */
export function enumValueNode<
    const TEnum extends DefinedTypeLinkNode = DefinedTypeLinkNode,
    const TValue extends EnumValuePayload | undefined = undefined,
>(enumLink: TEnum | string, variant: string, value?: TValue): EnumValueNode<TEnum, TValue> {
    return Object.freeze({
        kind: 'enumValueNode',

        // Data.
        variant: camelCase(variant),

        // Children.
        enum: (typeof enumLink === 'string' ? definedTypeLinkNode(enumLink) : enumLink) as TEnum,
        ...(value !== undefined && { value }),
    });
}
