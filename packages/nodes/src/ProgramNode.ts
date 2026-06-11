import type {
    AccountNode,
    ConstantNode,
    DefinedTypeNode,
    ErrorNode,
    EventNode,
    InstructionNode,
    PdaNode,
    ProgramNode,
    RootNode,
} from '@codama/node-types';

export function getAllPrograms(node: ProgramNode | ProgramNode[] | RootNode): ProgramNode[] {
    if (Array.isArray(node)) return node;
    if (node.kind === 'programNode') return [node];
    return [node.program, ...node.additionalPrograms];
}

export function getAllPdas(node: ProgramNode | ProgramNode[] | RootNode): PdaNode[] {
    return getAllPrograms(node).flatMap(program => program.pdas);
}

export function getAllAccounts(node: ProgramNode | ProgramNode[] | RootNode): AccountNode[] {
    return getAllPrograms(node).flatMap(program => program.accounts);
}

export function getAllEvents(node: ProgramNode | ProgramNode[] | RootNode): EventNode[] {
    return getAllPrograms(node).flatMap(program => program.events);
}

export function getAllDefinedTypes(node: ProgramNode | ProgramNode[] | RootNode): DefinedTypeNode[] {
    return getAllPrograms(node).flatMap(program => program.definedTypes);
}

export function getAllInstructions(node: ProgramNode | ProgramNode[] | RootNode): InstructionNode[] {
    return getAllPrograms(node).flatMap(program => program.instructions);
}

export function getAllErrors(node: ProgramNode | ProgramNode[] | RootNode): ErrorNode[] {
    return getAllPrograms(node).flatMap(program => program.errors);
}

export function getAllConstants(node: ProgramNode | ProgramNode[] | RootNode): ConstantNode[] {
    return getAllPrograms(node).flatMap(program => program.constants);
}
