import type { AccountValueNode, ArgumentValueNode, PdaSeedValueNode, ValueNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function pdaSeedValueNode<
    TValue extends AccountValueNode | ArgumentValueNode | ValueNode = AccountValueNode | ArgumentValueNode | ValueNode,
>(name: string, value: TValue): PdaSeedValueNode<TValue> {
    return Object.freeze({
        kind: 'pdaSeedValueNode',

        // Data.
        name: camelCase(name),

        // Children.
        value,
    });
}
