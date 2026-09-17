import type { InjectedValueNode } from './InjectedValueNode';
import type { IntegerValueNode } from './IntegerValueNode';

/** A concrete integer value, or a key resolved at presentation time from a surrounding provider. */
export type InjectableIntegerValueNode = InjectedValueNode | IntegerValueNode;
