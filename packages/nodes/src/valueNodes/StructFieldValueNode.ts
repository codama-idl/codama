import type { StructFieldValueNode, ValueNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function structFieldValueNode<TValue extends ValueNode>(
    name: string,
    value: TValue,
): StructFieldValueNode<TValue> {
    return Object.freeze({
        kind: 'structFieldValueNode',

        // Data.
        name: camelCase(name),

        // Children.
        value,
    });
}
