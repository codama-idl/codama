import type {
    AccountNode,
    ConstantNode,
    DefinedTypeNode,
    ErrorNode,
    EventNode,
    InstructionNode,
    PdaNode,
    PluginNode,
    ProgramNode,
    TextNode,
} from '@codama/node-types';

import { identifierString } from '../shared';

export type ProgramNodeInput<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TPdas extends Array<PdaNode> | undefined = Array<PdaNode> | undefined,
    TAccounts extends Array<AccountNode> | undefined = Array<AccountNode> | undefined,
    TInstructions extends Array<InstructionNode> | undefined = Array<InstructionNode> | undefined,
    TDefinedTypes extends Array<DefinedTypeNode> | undefined = Array<DefinedTypeNode> | undefined,
    TErrors extends Array<ErrorNode> | undefined = Array<ErrorNode> | undefined,
    TEvents extends Array<EventNode> | undefined = Array<EventNode> | undefined,
    TConstants extends Array<ConstantNode> | undefined = Array<ConstantNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<
    Partial<ProgramNode<TDocs, TPdas, TAccounts, TInstructions, TDefinedTypes, TErrors, TEvents, TConstants, TPlugins>>,
    'identifier' | 'kind' | 'publicKey'
> & {
    readonly identifier: string;
    readonly publicKey: ProgramNode['publicKey'];
};

/**
 * A Solana program: its identity, version, accounts, instructions, defined types, PDAs, events, errors, and constants.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/37ec38ea-66df-4c08-81c3-822ef4388580)
 */
export function programNode<
    const TDocs extends string | TextNode | undefined = undefined,
    const TPdas extends Array<PdaNode> | undefined = [],
    const TAccounts extends Array<AccountNode> | undefined = [],
    const TInstructions extends Array<InstructionNode> | undefined = [],
    const TDefinedTypes extends Array<DefinedTypeNode> | undefined = [],
    const TErrors extends Array<ErrorNode> | undefined = [],
    const TEvents extends Array<EventNode> | undefined = [],
    const TConstants extends Array<ConstantNode> | undefined = [],
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    input: ProgramNodeInput<
        TDocs,
        TPdas,
        TAccounts,
        TInstructions,
        TDefinedTypes,
        TErrors,
        TEvents,
        TConstants,
        TPlugins
    >,
): ProgramNode<TDocs, TPdas, TAccounts, TInstructions, TDefinedTypes, TErrors, TEvents, TConstants, TPlugins> {
    return Object.freeze({
        kind: 'programNode',

        // Data.
        identifier: identifierString(input.identifier),
        publicKey: input.publicKey,
        version: input.version ?? '0.0.0',

        // Children.
        ...(input.docs !== undefined && { docs: input.docs }),
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
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
