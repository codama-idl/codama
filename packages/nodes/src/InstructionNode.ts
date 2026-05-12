import type {
    InstructionArgumentNode,
    InstructionNode,
    OptionalAccountStrategy,
    ProgramNode,
    RootNode,
} from '@codama/node-types';

import { isNode } from './Node';
import { getAllInstructions } from './ProgramNode';

export function parseOptionalAccountStrategy(
    optionalAccountStrategy: OptionalAccountStrategy | undefined,
): OptionalAccountStrategy {
    return optionalAccountStrategy ?? 'programId';
}

export function getAllInstructionArguments(node: InstructionNode): InstructionArgumentNode[] {
    return [...node.arguments, ...(node.extraArguments ?? [])];
}

export function getAllInstructionsWithSubs(
    node: InstructionNode | ProgramNode | RootNode,
    config: { leavesOnly?: boolean; subInstructionsFirst?: boolean } = {},
): InstructionNode[] {
    const { leavesOnly = false, subInstructionsFirst = false } = config;
    if (isNode(node, 'instructionNode')) {
        if (!node.subInstructions || node.subInstructions.length === 0) return [node];
        const subInstructions = node.subInstructions.flatMap(sub => getAllInstructionsWithSubs(sub, config));
        if (leavesOnly) return subInstructions;
        return subInstructionsFirst ? [...subInstructions, node] : [node, ...subInstructions];
    }

    const instructions = isNode(node, 'programNode') ? node.instructions : getAllInstructions(node);

    return instructions.flatMap(instruction => getAllInstructionsWithSubs(instruction, config));
}
