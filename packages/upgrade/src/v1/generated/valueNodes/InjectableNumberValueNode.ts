import type { InjectedValueNode } from './InjectedValueNode';
import type { NumberValueNode } from './NumberValueNode';

/** A concrete number value, or a key resolved at presentation time from a surrounding provider. */
export type InjectableNumberValueNode = InjectedValueNode | NumberValueNode;
