import type { PdaLinkNode } from '../linkNodes/PdaLinkNode';
import type { PdaNode } from '../PdaNode';

/** A `pdaValueNode` may reference a PDA either by link or inline. */
export type PdaValuePda = PdaLinkNode | PdaNode;
