import type {
    AccountNode,
    DefinedTypeNode,
    ErrorNode,
    InstructionNode,
    PdaNode,
    ProgramNode,
    RootNode,
} from '@kinobi-so/node-types';

import { camelCase, DocsInput, parseDocs } from './shared';

export type ProgramNodeInput<
    TPdas extends PdaNode[] = PdaNode[],
    TAccounts extends AccountNode[] = AccountNode[],
    TInstructions extends InstructionNode[] = InstructionNode[],
    TDefinedTypes extends DefinedTypeNode[] = DefinedTypeNode[],
    TErrors extends ErrorNode[] = ErrorNode[],
> = Omit<
    Partial<ProgramNode<TPdas, TAccounts, TInstructions, TDefinedTypes, TErrors>>,
    'docs' | 'kind' | 'name' | 'publicKey'
> & {
    readonly docs?: DocsInput;
    readonly name: string;
    readonly publicKey: ProgramNode['publicKey'];
};

export function programNode<
    const TPdas extends PdaNode[] = [],
    const TAccounts extends AccountNode[] = [],
    const TInstructions extends InstructionNode[] = [],
    const TDefinedTypes extends DefinedTypeNode[] = [],
    const TErrors extends ErrorNode[] = [],
>(
    input: ProgramNodeInput<TPdas, TAccounts, TInstructions, TDefinedTypes, TErrors>,
): ProgramNode<TPdas, TAccounts, TInstructions, TDefinedTypes, TErrors> {
    return Object.freeze({
        kind: 'programNode',

        // Data.
        name: camelCase(input.name),
        publicKey: input.publicKey,
        version: input.version ?? '0.0.0',
        ...(input.origin !== undefined && { origin: input.origin }),
        docs: parseDocs(input.docs),

        // Children.
        accounts: (input.accounts ?? []) as TAccounts,
        instructions: (input.instructions ?? []) as TInstructions,
        definedTypes: (input.definedTypes ?? []) as TDefinedTypes,
        pdas: (input.pdas ?? []) as TPdas,
        errors: (input.errors ?? []) as TErrors,
    });
}

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

export function getAllDefinedTypes(node: ProgramNode | ProgramNode[] | RootNode): DefinedTypeNode[] {
    return getAllPrograms(node).flatMap(program => program.definedTypes);
}

export function getAllInstructions(node: ProgramNode | ProgramNode[] | RootNode): InstructionNode[] {
    return getAllPrograms(node).flatMap(program => program.instructions);
}

export function getAllErrors(node: ProgramNode | ProgramNode[] | RootNode): ErrorNode[] {
    return getAllPrograms(node).flatMap(program => program.errors);
}
