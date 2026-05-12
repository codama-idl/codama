import type {
    AccountNode,
    ConstantNode,
    DefinedTypeNode,
    ErrorNode,
    EventNode,
    InstructionNode,
    PdaNode,
    ProgramNode,
} from '@codama/node-types';
import { camelCase, DocsInput, parseDocs } from '../shared';

export type ProgramNodeInput<
    TPdas extends Array<PdaNode> = Array<PdaNode>,
    TAccounts extends Array<AccountNode> = Array<AccountNode>,
    TInstructions extends Array<InstructionNode> = Array<InstructionNode>,
    TDefinedTypes extends Array<DefinedTypeNode> = Array<DefinedTypeNode>,
    TErrors extends Array<ErrorNode> = Array<ErrorNode>,
    TEvents extends Array<EventNode> = Array<EventNode>,
    TConstants extends Array<ConstantNode> = Array<ConstantNode>,
> = Omit<
    Partial<ProgramNode<TPdas, TAccounts, TInstructions, TDefinedTypes, TErrors, TEvents, TConstants>>,
    'docs' | 'kind' | 'name' | 'publicKey'
> & {
    readonly name: string;
    readonly docs?: DocsInput;
    readonly publicKey: ProgramNode['publicKey'];
};

/** A Solana program: its identity, version, accounts, instructions, defined types, PDAs, events, errors, and constants. */
export function programNode<
    const TPdas extends Array<PdaNode> = [],
    const TAccounts extends Array<AccountNode> = [],
    const TInstructions extends Array<InstructionNode> = [],
    const TDefinedTypes extends Array<DefinedTypeNode> = [],
    const TErrors extends Array<ErrorNode> = [],
    const TEvents extends Array<EventNode> = [],
    const TConstants extends Array<ConstantNode> = [],
>(
    input: ProgramNodeInput<TPdas, TAccounts, TInstructions, TDefinedTypes, TErrors, TEvents, TConstants>,
): ProgramNode<TPdas, TAccounts, TInstructions, TDefinedTypes, TErrors, TEvents, TConstants> {
    const parsedDocs = parseDocs(input.docs);
    return Object.freeze({
        kind: 'programNode',

        // Data.
        name: camelCase(input.name),
        publicKey: input.publicKey,
        version: input.version ?? '0.0.0',
        ...(input.origin !== undefined && { origin: input.origin }),
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),

        // Children.
        accounts: (input.accounts ?? []) as TAccounts,
        instructions: (input.instructions ?? []) as TInstructions,
        definedTypes: (input.definedTypes ?? []) as TDefinedTypes,
        pdas: (input.pdas ?? []) as TPdas,
        events: (input.events ?? []) as TEvents,
        errors: (input.errors ?? []) as TErrors,
        constants: (input.constants ?? []) as TConstants,
    });
}
