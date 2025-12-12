import type { ConstantNode, Docs, TypeNode, ValueNode } from '@codama/node-types';

import { camelCase } from './shared';

export function constantNode<TType extends TypeNode = TypeNode, TValue extends ValueNode = ValueNode>(
    name: string,
    type: TType,
    value: TValue,
    docs?: Docs,
): ConstantNode<TType, TValue> {
    return Object.freeze({
        kind: 'constantNode',

        // data.
        name: camelCase(name),
        docs,

        // children.
        type,
        value,
    });
}
