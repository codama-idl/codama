import type { ProgramLinkNode } from '../linkNodes/ProgramLinkNode';
import type { ValueNode } from '../valueNodes/ValueNode';
import type { ContextualValueNode } from './ContextualValueNode';

/**
 * Anything that can be used as the input value for an instruction account or argument default.
 * Covers concrete values, contextual references, and program links.
 */
export type InstructionInputValueNode = ContextualValueNode | ProgramLinkNode | ValueNode;
