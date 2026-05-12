import { VALUE_NODE_KINDS } from '../valueNodes/ValueNode';

/** The value forms accepted by a `pdaSeedValueNode`. */
export const PDA_SEED_VALUE_VALUE_KINDS = [
    'accountValueNode' as const,
    'argumentValueNode' as const,
    ...VALUE_NODE_KINDS,
];
