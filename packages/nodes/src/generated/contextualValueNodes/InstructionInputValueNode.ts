import { VALUE_NODE_KINDS } from '../valueNodes/ValueNode';
import { CONTEXTUAL_VALUE_NODE_KINDS } from './ContextualValueNode';

/**
 * Anything that can be used as the input value for an instruction account default or a conditional branch.
 * Covers concrete values, contextual references, and program links.
 */
export const INSTRUCTION_INPUT_VALUE_NODE_KINDS = [
    ...CONTEXTUAL_VALUE_NODE_KINDS,
    'programLinkNode' as const,
    ...VALUE_NODE_KINDS,
];
