import type { AccountValueNode } from './AccountValueNode';
import type { DataValueNode } from './DataValueNode';

/** The program-id forms accepted by a `pdaValueNode`. */
export type PdaValueProgramId = AccountValueNode | DataValueNode;
