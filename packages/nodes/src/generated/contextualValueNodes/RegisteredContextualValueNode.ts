import { STANDALONE_CONTEXTUAL_VALUE_NODE_KINDS } from './StandaloneContextualValueNode';

/** Every node tagged as a contextual-value node, including helper variants. */
export const REGISTERED_CONTEXTUAL_VALUE_NODE_KINDS = [
    'pdaSeedValueNode' as const,
    ...STANDALONE_CONTEXTUAL_VALUE_NODE_KINDS,
];
