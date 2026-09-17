import type { ValueNode } from '../valueNodes/ValueNode';
import type { AccountValueNode } from './AccountValueNode';
import type { DataValueNode } from './DataValueNode';

/** The value forms accepted by a `pdaSeedValueNode`. */
export type PdaSeedValueValue = AccountValueNode | DataValueNode | ValueNode;
