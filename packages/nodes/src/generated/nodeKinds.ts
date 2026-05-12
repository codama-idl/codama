import { REGISTERED_CONTEXTUAL_VALUE_NODE_KINDS } from './contextualValueNodes/RegisteredContextualValueNode';
import { REGISTERED_COUNT_NODE_KINDS } from './countNodes/RegisteredCountNode';
import { REGISTERED_DISCRIMINATOR_NODE_KINDS } from './discriminatorNodes/RegisteredDiscriminatorNode';
import { REGISTERED_LINK_NODE_KINDS } from './linkNodes/RegisteredLinkNode';
import { REGISTERED_PDA_SEED_NODE_KINDS } from './pdaSeedNodes/RegisteredPdaSeedNode';
import { REGISTERED_TYPE_NODE_KINDS } from './typeNodes/RegisteredTypeNode';
import { REGISTERED_VALUE_NODE_KINDS } from './valueNodes/RegisteredValueNode';

// Node Registration.
export const REGISTERED_NODE_KINDS = [
    'accountNode' as const,
    'constantNode' as const,
    'definedTypeNode' as const,
    'errorNode' as const,
    'eventNode' as const,
    'instructionAccountNode' as const,
    'instructionArgumentNode' as const,
    'instructionByteDeltaNode' as const,
    'instructionNode' as const,
    'instructionRemainingAccountsNode' as const,
    'instructionStatusNode' as const,
    'pdaNode' as const,
    'programNode' as const,
    'rootNode' as const,
    ...REGISTERED_CONTEXTUAL_VALUE_NODE_KINDS,
    ...REGISTERED_COUNT_NODE_KINDS,
    ...REGISTERED_DISCRIMINATOR_NODE_KINDS,
    ...REGISTERED_LINK_NODE_KINDS,
    ...REGISTERED_PDA_SEED_NODE_KINDS,
    ...REGISTERED_TYPE_NODE_KINDS,
    ...REGISTERED_VALUE_NODE_KINDS,
];
