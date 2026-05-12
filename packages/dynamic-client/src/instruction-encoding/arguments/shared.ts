import { OPTIONAL_NODE_KINDS } from '@codama/dynamic-address-resolution';
import type { InstructionArgumentNode } from 'codama';

export function isOmittedArgument(node: InstructionArgumentNode) {
    return node.defaultValueStrategy === 'omitted';
}

export function isOptionalArgument(ixArgumentNode: InstructionArgumentNode, input: unknown) {
    return OPTIONAL_NODE_KINDS.includes(ixArgumentNode.type.kind) && (input === null || input === undefined);
}
