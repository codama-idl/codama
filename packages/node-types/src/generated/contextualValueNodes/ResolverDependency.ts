import type { AccountValueNode } from './AccountValueNode';
import type { ArgumentValueNode } from './ArgumentValueNode';

/** The dependency forms accepted by a `resolverValueNode`. */
export type ResolverDependency = AccountValueNode | ArgumentValueNode;
