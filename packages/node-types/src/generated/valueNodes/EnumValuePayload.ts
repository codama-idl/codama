import type { StructValueNode } from './StructValueNode';
import type { TupleValueNode } from './TupleValueNode';

/** The payload kinds an `enumValueNode` may carry — struct fields or positional tuple slots. */
export type EnumValuePayload = StructValueNode | TupleValueNode;
