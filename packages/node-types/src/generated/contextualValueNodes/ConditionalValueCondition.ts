import type { AccountValueNode } from './AccountValueNode';
import type { DataValueNode } from './DataValueNode';

/** The condition forms accepted by a `conditionalValueNode`. */
export type ConditionalValueCondition = AccountValueNode | DataValueNode;
