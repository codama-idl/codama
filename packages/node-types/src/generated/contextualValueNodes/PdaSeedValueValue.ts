import type { ValueNode } from '../valueNodes/ValueNode';
import type { AccountValueNode } from './AccountValueNode';
import type { ArgumentValueNode } from './ArgumentValueNode';

/** The value forms accepted by a `pdaSeedValueNode`. */
export type PdaSeedValueValue = AccountValueNode | ArgumentValueNode | ValueNode;
