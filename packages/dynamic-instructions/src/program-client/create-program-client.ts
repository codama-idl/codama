import { type Address, address, type ProgramDerivedAddress } from '@solana/addresses';
import type { Instruction } from '@solana/instructions';
import type { InstructionNode, RootNode } from 'codama';
import { createFromJson, updateProgramsVisitor } from 'codama';

import type { AddressInput } from '../shared/address';
import { toAddress } from '../shared/address';
import { DynamicInstructionsError } from '../shared/errors';
import type { AccountsInput, ArgumentsInput, ResolversInput } from '../shared/types';
import { collectPdaNodes } from './collect-pdas';
import { deriveStandalonePDA } from './derive-standalone-pda';
import { MethodsBuilder } from './methods-builder';

export type IdlInput = object | string;

export type CreateProgramClientOptions = {
    /**
     * Optional override for the program id.
     * If not provided, uses `root.program.publicKey` from the IDL.
     */
    programId?: AddressInput;
};

export type ProgramClient = {
    /** Quick lookup by instruction name. */
    instructions: Map<string, InstructionNode>;
    /** Anchor-like facade namespace for building instructions. */
    methods: Record<string, (args?: ArgumentsInput) => ProgramMethodBuilder>;
    /** Anchor-like facade namespace for standalone PDA derivation. */
    pdas?: Record<string, (seeds?: Record<string, unknown>) => Promise<ProgramDerivedAddress>>;
    /** Program id as an `Address`. */
    programAddress: Address;
    /** Parsed Codama root node for advanced use-cases. */
    root: RootNode;
};

export type ProgramMethodBuilder = {
    accounts(accounts: AccountsInput): ProgramMethodBuilder;
    instruction(): Promise<Instruction>;
    resolvers(resolvers: ResolversInput): ProgramMethodBuilder;
    signers(signers: string[]): ProgramMethodBuilder;
};

/**
 * Creates a program client from a Codama IDL.
 *
 * For type safety, generate types and pass as a generic. See the README.md for details.
 */
export function createProgramClient<TClient = ProgramClient>(
    idl: IdlInput,
    options: CreateProgramClientOptions = {},
): TClient {
    const json = typeof idl === 'string' ? idl : JSON.stringify(idl);
    const codama = createFromJson(json);
    let root = codama.getRoot();

    if (options.programId) {
        codama.update(
            updateProgramsVisitor({
                [root.program.name]: {
                    publicKey: toAddress(options.programId),
                },
            }),
        );
        root = codama.getRoot();
    }
    const programAddress = address(root.program.publicKey);

    const instructions = new Map<string, InstructionNode>();
    for (const ix of root.program.instructions) {
        instructions.set(ix.name, ix);
    }

    const methods = new Proxy(
        {},
        {
            get(_target, prop) {
                if (typeof prop !== 'string' || PASSTHROUGH_PROPS.has(prop)) return undefined;

                const ixNode = instructions.get(prop);
                if (!ixNode) {
                    if (prop in Object.prototype) return undefined;
                    const available = [...instructions.keys()].join(', ');
                    throw new DynamicInstructionsError(
                        `Instruction "${prop}" not found in IDL. Available instructions: ${available}`,
                    );
                }

                return (args?: ArgumentsInput) => new MethodsBuilder(root, ixNode, args) as ProgramMethodBuilder;
            },
            has(target, prop) {
                return Reflect.has(target, prop) || (typeof prop === 'string' && instructions.has(prop));
            },
        },
    ) as ProgramClient['methods'];

    const pdaNodes = collectPdaNodes(root);

    const pdas =
        pdaNodes.size === 0
            ? undefined
            : (new Proxy(
                  {},
                  {
                      get(_target, prop) {
                          if (typeof prop !== 'string' || PASSTHROUGH_PROPS.has(prop)) return undefined;

                          const pdaNode = pdaNodes.get(prop);
                          if (!pdaNode) {
                              if (prop in Object.prototype) return undefined;
                              const available = [...pdaNodes.keys()].join(', ');
                              throw new DynamicInstructionsError(
                                  `PDA "${prop}" not found in IDL. Available PDAs: ${available}`,
                              );
                          }

                          return (seeds?: Record<string, unknown>) => deriveStandalonePDA(root, pdaNode, seeds);
                      },
                      has(target, prop) {
                          return Reflect.has(target, prop) || (typeof prop === 'string' && pdaNodes.has(prop));
                      },
                  },
              ) as ProgramClient['pdas']);

    return {
        instructions,
        methods,
        pdas,
        programAddress,
        root,
    } as unknown as TClient;
}

const PASSTHROUGH_PROPS = new Set<string>(['then', 'toJSON', 'valueOf', 'toString']);
