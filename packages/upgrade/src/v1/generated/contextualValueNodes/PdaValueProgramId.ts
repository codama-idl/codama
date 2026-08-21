import type { AccountValueNode } from './AccountValueNode';
import type { ArgumentValueNode } from './ArgumentValueNode';

/** The program-id forms accepted by a `pdaValueNode`. */
export type PdaValueProgramId = AccountValueNode | ArgumentValueNode;
