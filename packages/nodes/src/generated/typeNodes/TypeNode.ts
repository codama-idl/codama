import { STANDALONE_TYPE_NODE_KINDS } from './StandaloneTypeNode';

/** The composable form: any standalone type, or a reference to a defined type via `definedTypeLinkNode`. */
export const TYPE_NODE_KINDS = ['definedTypeLinkNode' as const, ...STANDALONE_TYPE_NODE_KINDS];
