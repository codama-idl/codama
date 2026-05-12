import { STANDALONE_VALUE_NODE_KINDS } from './StandaloneValueNode';

/** Every node tagged as a value-shaped node, including container variants. */
export const REGISTERED_VALUE_NODE_KINDS = [
    'mapEntryValueNode' as const,
    ...STANDALONE_VALUE_NODE_KINDS,
    'structFieldValueNode' as const,
];
