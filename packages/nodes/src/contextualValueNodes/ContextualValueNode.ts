import { VALUE_NODES } from '../valueNodes/ValueNode';

// Standalone Contextual Value Node Registration.
export const STANDALONE_CONTEXTUAL_VALUE_NODE_KINDS = [
    'accountBumpValueNode' as const,
    'accountValueNode' as const,
    'argumentValueNode' as const,
    'conditionalValueNode' as const,
    'identityValueNode' as const,
    'payerValueNode' as const,
    'pdaValueNode' as const,
    'programIdValueNode' as const,
    'resolverValueNode' as const,
];

// Contextual Value Node Registration.
export const REGISTERED_CONTEXTUAL_VALUE_NODE_KINDS = [
    ...STANDALONE_CONTEXTUAL_VALUE_NODE_KINDS,
    'pdaSeedValueNode' as const,
];

// Contextual Value Node Helpers.
export const CONTEXTUAL_VALUE_NODES = STANDALONE_CONTEXTUAL_VALUE_NODE_KINDS;
export const INSTRUCTION_INPUT_VALUE_NODES = [...VALUE_NODES, ...CONTEXTUAL_VALUE_NODES, 'programLinkNode' as const];
