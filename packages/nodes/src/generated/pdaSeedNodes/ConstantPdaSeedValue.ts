import { VALUE_NODE_KINDS } from '../valueNodes/ValueNode';

/** The value forms a `constantPdaSeedNode` may carry — either a literal value or the program ID placeholder. */
export const CONSTANT_PDA_SEED_VALUE_KINDS = ['programIdValueNode' as const, ...VALUE_NODE_KINDS];
