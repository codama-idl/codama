import type { ConstantPdaSeedNode } from './ConstantPdaSeedNode';
import type { VariablePdaSeedNode } from './VariablePdaSeedNode';

// Pda Seed Node Registration.
export type RegisteredPdaSeedNode = ConstantPdaSeedNode | VariablePdaSeedNode;

// Pda Seed Node Helpers.
export type PdaSeedNode = RegisteredPdaSeedNode;
