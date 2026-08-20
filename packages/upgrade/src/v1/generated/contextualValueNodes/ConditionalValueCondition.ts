import type { AccountValueNode } from './AccountValueNode';
import type { ArgumentValueNode } from './ArgumentValueNode';
import type { ResolverValueNode } from './ResolverValueNode';

/** The condition forms accepted by a `conditionalValueNode`. */
export type ConditionalValueCondition = AccountValueNode | ArgumentValueNode | ResolverValueNode;
