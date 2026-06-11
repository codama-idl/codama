import type { ProgramIdValueNode } from '../contextualValueNodes/ProgramIdValueNode';
import type { ValueNode } from '../valueNodes/ValueNode';

/** The value forms a `constantPdaSeedNode` may carry — either a literal value or the program ID placeholder. */
export type ConstantPdaSeedValue = ProgramIdValueNode | ValueNode;
