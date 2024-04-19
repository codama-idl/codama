import type { CamelCaseString } from '../shared';
import type { ValueNode } from '../valueNodes';
import type { AccountValueNode } from './AccountValueNode';
import type { ArgumentValueNode } from './ArgumentValueNode';

export interface PdaSeedValueNode<
    TValue extends AccountValueNode | ArgumentValueNode | ValueNode = AccountValueNode | ArgumentValueNode | ValueNode,
> {
    readonly kind: 'pdaSeedValueNode';

    // Data.
    readonly name: CamelCaseString;

    // Children.
    readonly value: TValue;
}
