import {
    type AccountsInput,
    type AddressInput,
    type DataInput,
    type FetchAccountsFn,
    readsAccountData,
    resolveStandalonePda,
    toAddress,
} from '@codama/dynamic-address-resolution';
import { createInstructionsBuilder, type InstructionsBuilderFn } from '@codama/dynamic-instructions';
import {
    CODAMA_ERROR__DYNAMIC_CLIENT__INSTRUCTION_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__PDA_NOT_FOUND,
    CodamaError,
} from '@codama/errors';
import { type Address, address, type ProgramDerivedAddress } from '@solana/addresses';
import type { Instruction } from '@solana/instructions';
import type { InstructionNode, RootNode } from 'codama';
import { createFromJson, getLinkablesFromNode, updateProgramsVisitor } from 'codama';

import { collectPdaPaths } from './collect-pdas';
import { MethodsBuilder } from './methods-builder';

/**
 * A Codama IDL of the latest major, as a root node object or as its JSON.
 * Upgrade IDLs of older majors with `upgrade` from `@codama/upgrade` first.
 */
export type IdlInput = object | string;

export type CreateProgramClientOptions = {
    /**
     * Fetches the accounts whose data default values read when building instructions, e.g. a
     * mint for its `decimals`. Required, in the generated client types, for programs with
     * instructions reading account data.
     */
    fetchAccounts?: FetchAccountsFn;
    /**
     * Optional override for the program id.
     * If not provided, uses `root.program.publicKey` from the IDL.
     */
    programId?: AddressInput;
};

export type ProgramClient = {
    /** Quick lookup by instruction name. */
    instructions: Map<string, InstructionNode>;
    /** Anchor-like facade namespace for building instructions from their data. */
    methods: Record<string, (data?: DataInput) => ProgramMethodBuilder>;
    /** Anchor-like facade namespace for standalone PDA derivation. */
    pdas?: Record<string, (seeds?: Record<string, unknown>, options?: PdaOptions) => Promise<ProgramDerivedAddress>>;
    /** Program id as an `Address`. */
    programAddress: Address;
    /**
     * Whether building some of its instructions reads account data, which requires the
     * `fetchAccounts` option. Generated client types set it to `true` or `false`.
     */
    readsAccountData: boolean;
    /** Parsed Codama root node, for advanced use-cases. */
    root: RootNode;
};

export type PdaOptions = {
    /**
     * The program deriving the PDA, e.g. for PDAs that instructions derive from
     * another program through their `pdaValueNode.programId`. Defaults to the
     * `programId` of the PDA, or else the address of the program defining it.
     */
    programId?: AddressInput;
};

export type ProgramMethodBuilder = {
    accounts(accounts: AccountsInput): ProgramMethodBuilder;
    instruction(): Promise<Instruction>;
    signers(signers: string[]): ProgramMethodBuilder;
};

/**
 * Creates a program client from a Codama IDL of the latest major. IDLs of
 * older majors throw `CODAMA_ERROR__VERSION_MISMATCH`: upgrade them with
 * `upgrade` from `@codama/upgrade` first.
 *
 * For type safety, generate types and pass as a generic. See the README.md for details.
 */
export function createProgramClient<TClient = ProgramClient>(
    idl: IdlInput,
    ...[options = {}]: [TClient] extends [{ readsAccountData: true }]
        ? [options: CreateProgramClientOptions & { fetchAccounts: FetchAccountsFn }]
        : [options?: CreateProgramClientOptions]
): TClient {
    const json = typeof idl === 'string' ? idl : JSON.stringify(idl);
    const codama = createFromJson(json);

    if (options.programId) {
        codama.update(
            updateProgramsVisitor({
                [codama.getRoot().program.identifier]: {
                    publicKey: toAddress(options.programId),
                },
            }),
        );
    }

    const root = codama.getRoot();
    const programAddress = address(root.program.publicKey);
    const linkables = getLinkablesFromNode(root);

    const instructions = new Map<string, InstructionNode>();
    for (const ix of root.program.instructions ?? []) {
        instructions.set(ix.identifier, ix);
    }

    // Each instruction gets a single builder, created on first use, sharing the client's linkables.
    const builders = new Map<InstructionNode, InstructionsBuilderFn>();
    const getBuilder = (ixNode: InstructionNode): InstructionsBuilderFn => {
        let builder = builders.get(ixNode);
        if (!builder) {
            builder = createInstructionsBuilder([root, root.program, ixNode], {
                fetchAccounts: options.fetchAccounts,
                linkables,
            });
            builders.set(ixNode, builder);
        }
        return builder;
    };

    const methods = new Proxy(
        {},
        {
            get(_target, prop) {
                if (typeof prop !== 'string' || PASSTHROUGH_PROPS.has(prop)) return undefined;

                const ixNode = instructions.get(prop);
                if (!ixNode) {
                    if (prop in Object.prototype) return undefined;
                    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INSTRUCTION_NOT_FOUND, {
                        availableIxs: [...instructions.keys()],
                        instructionName: prop,
                    });
                }

                return (data?: DataInput) => new MethodsBuilder(getBuilder(ixNode), data) as ProgramMethodBuilder;
            },
            has(target, prop) {
                return Reflect.has(target, prop) || (typeof prop === 'string' && instructions.has(prop));
            },
        },
    ) as ProgramClient['methods'];

    const pdaPaths = collectPdaPaths(root);

    const pdas =
        pdaPaths.size === 0
            ? undefined
            : (new Proxy(
                  {},
                  {
                      get(_target, prop) {
                          if (typeof prop !== 'string' || PASSTHROUGH_PROPS.has(prop)) return undefined;

                          const pdaPath = pdaPaths.get(prop);
                          if (!pdaPath) {
                              if (prop in Object.prototype) return undefined;
                              const available = [...pdaPaths.keys()].join(', ');
                              throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__PDA_NOT_FOUND, {
                                  available,
                                  pdaName: prop,
                              });
                          }

                          return (seeds?: Record<string, unknown>, pdaOptions: PdaOptions = {}) =>
                              resolveStandalonePda({
                                  linkables,
                                  path: pdaPath,
                                  programId: pdaOptions.programId,
                                  seedsInput: seeds,
                              });
                      },
                      has(target, prop) {
                          return Reflect.has(target, prop) || (typeof prop === 'string' && pdaPaths.has(prop));
                      },
                  },
              ) as ProgramClient['pdas']);

    return {
        instructions,
        methods,
        pdas,
        programAddress,
        readsAccountData: [...instructions.values()].some(ix => readsAccountData([root, root.program, ix], linkables)),
        root,
    } as unknown as TClient;
}

const PASSTHROUGH_PROPS = new Set<string>(['then', 'toJSON', 'valueOf', 'toString']);
