import type { ConstantPdaSeedNode } from './ConstantPdaSeedNode';
import type { VariablePdaSeedNode } from './VariablePdaSeedNode';

/** Every node tagged as a PDA seed. */
export type RegisteredPdaSeedNode = ConstantPdaSeedNode | VariablePdaSeedNode;
