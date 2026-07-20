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
    TPdas extends Array<PdaNode> | undefined = Array<PdaNode> | undefined,
    TAccounts extends Array<AccountNode> | undefined = Array<AccountNode> | undefined,
    TInstructions extends Array<InstructionNode> | undefined = Array<InstructionNode> | undefined,
    TDefinedTypes extends Array<DefinedTypeNode> | undefined = Array<DefinedTypeNode> | undefined,
    TErrors extends Array<ErrorNode> | undefined = Array<ErrorNode> | undefined,
    TEvents extends Array<EventNode> | undefined = Array<EventNode> | undefined,
    TConstants extends Array<ConstantNode> | undefined = Array<ConstantNode> | undefined,
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
    const TPdas extends Array<PdaNode> | undefined = [],
    const TAccounts extends Array<AccountNode> | undefined = [],
    const TInstructions extends Array<InstructionNode> | undefined = [],
    const TDefinedTypes extends Array<DefinedTypeNode> | undefined = [],
    const TErrors extends Array<ErrorNode> | undefined = [],
    const TEvents extends Array<EventNode> | undefined = [],
    const TConstants extends Array<ConstantNode> | undefined = [],
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
        ...(input.accounts !== undefined && input.accounts.length > 0 && { accounts: input.accounts as TAccounts }),
        ...(input.instructions !== undefined &&
            input.instructions.length > 0 && { instructions: input.instructions as TInstructions }),
        ...(input.definedTypes !== undefined &&
            input.definedTypes.length > 0 && { definedTypes: input.definedTypes as TDefinedTypes }),
        ...(input.pdas !== undefined && input.pdas.length > 0 && { pdas: input.pdas as TPdas }),
        ...(input.events !== undefined && input.events.length > 0 && { events: input.events as TEvents }),
        ...(input.errors !== undefined && input.errors.length > 0 && { errors: input.errors as TErrors }),
        ...(input.constants !== undefined &&
            input.constants.length > 0 && { constants: input.constants as TConstants }),
    });
}
