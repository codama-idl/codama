import type { DefinedTypeLinkNode, EnumValueNode, StructValueNode, TupleValueNode } from '@codama/node-types';

import { definedTypeLinkNode } from '../linkNodes';
import { camelCase } from '../shared';

export function enumValueNode<
    TEnum extends DefinedTypeLinkNode = DefinedTypeLinkNode,
    TValue extends StructValueNode | TupleValueNode | undefined = undefined,
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
