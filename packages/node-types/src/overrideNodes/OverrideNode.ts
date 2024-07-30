import type { InstructionAccountOverrideNode } from './InstructionAccountOverrideNode';
import type { InstructionArgumentOverrideNode } from './InstructionArgumentOverrideNode';

// Override Node Registration.
export type RegisteredOverrideNode = InstructionAccountOverrideNode | InstructionArgumentOverrideNode;

// Override Node Helpers.
export type OverrideNode = RegisteredOverrideNode;
