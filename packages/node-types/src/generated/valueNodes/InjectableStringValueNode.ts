import type { InjectedValueNode } from './InjectedValueNode';
import type { StringValueNode } from './StringValueNode';

/** A concrete string value, or a key resolved at presentation time from a surrounding provider. */
export type InjectableStringValueNode = InjectedValueNode | StringValueNode;
