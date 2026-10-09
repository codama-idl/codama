import type { Address, ProgramDerivedAddress } from '@solana/addresses';
import type { Instruction } from '@solana/instructions';
import type { InstructionNode, RootNode } from 'codama';
import { describe, expectTypeOf, test } from 'vitest';

import type {
    ConditionalTransferAccounts,
    TransferWithResolverAccounts,
} from '../../programs/generated/custom-resolvers-test-idl-types';
import type {
    AllocateInstructionDataArgs,
    CanonicalSeeds,
    NonCanonicalSeeds,
    ProgramMetadataPdas,
    ProgramMetadataProgramClient,
    WriteInstructionDataArgs,
} from '../../programs/generated/pmp-idl-types';
import type {
    CreateAccountAccounts,
    CreateAccountInstructionDataArgs,
    CreateAccountMethod,
    SystemMethods,
    SystemProgramClient,
} from '../../programs/generated/system-program-idl-types';
import type { InitializeConfidentialTransferMintInstructionDataArgs } from '../../programs/generated/token-2022-idl-types';

describe('generated program client types', () => {
    describe('program client without PDAs (SystemProgramClient)', () => {
        test('should align with ProgramClient structure', () => {
            expectTypeOf<SystemProgramClient>().toHaveProperty('instructions');
            expectTypeOf<SystemProgramClient['instructions']>().toEqualTypeOf<Map<string, InstructionNode>>();
            expectTypeOf<SystemProgramClient['methods']>().toEqualTypeOf<SystemMethods>();
            expectTypeOf<SystemProgramClient>().not.toHaveProperty('pdas');

            expectTypeOf<SystemProgramClient>().toHaveProperty('programAddress');
            expectTypeOf<SystemProgramClient['programAddress']>().toEqualTypeOf<Address>();

            expectTypeOf<SystemProgramClient>().toHaveProperty('root');
            expectTypeOf<SystemProgramClient['root']>().toEqualTypeOf<RootNode>();
        });

        test('should have expected method keys on SystemMethods', () => {
            type ExpectedKeys =
                | 'advanceNonceAccount'
                | 'allocate'
                | 'allocateWithSeed'
                | 'assign'
                | 'assignWithSeed'
                | 'authorizeNonceAccount'
                | 'createAccount'
                | 'createAccountWithSeed'
                | 'initializeNonceAccount'
                | 'transferSol'
                | 'transferSolWithSeed'
                | 'upgradeNonceAccount'
                | 'withdrawNonceAccount';
            expectTypeOf<keyof SystemMethods>().toEqualTypeOf<ExpectedKeys>();
        });

        test('should return MethodBuilder from method call', () => {
            type MethodsBuilder = ReturnType<CreateAccountMethod>;
            expectTypeOf<MethodsBuilder>().toHaveProperty('accounts');
            expectTypeOf<MethodsBuilder['accounts']>().returns.toEqualTypeOf<MethodsBuilder>();

            expectTypeOf<MethodsBuilder>().toHaveProperty('instruction');
            expectTypeOf<MethodsBuilder['instruction']>().returns.toEqualTypeOf<Promise<Instruction>>();

            expectTypeOf<MethodsBuilder>().toHaveProperty('signers');
            expectTypeOf<MethodsBuilder['signers']>().returns.toEqualTypeOf<MethodsBuilder>();

            expectTypeOf<MethodsBuilder>().not.toHaveProperty('resolvers');
        });

        test('should have correct properties on CreateAccountInstructionDataArgs', () => {
            expectTypeOf<CreateAccountInstructionDataArgs>().toHaveProperty('lamports');
            expectTypeOf<CreateAccountInstructionDataArgs['lamports']>().toEqualTypeOf<bigint | number>();

            expectTypeOf<CreateAccountInstructionDataArgs>().toHaveProperty('space');
            expectTypeOf<CreateAccountInstructionDataArgs['space']>().toEqualTypeOf<bigint | number>();

            expectTypeOf<CreateAccountInstructionDataArgs>().toHaveProperty('programAddress');
            expectTypeOf<CreateAccountInstructionDataArgs['programAddress']>().toEqualTypeOf<Address>();
        });

        test('should have correct properties on CreateAccountAccounts', () => {
            expectTypeOf<CreateAccountAccounts['payer']>().toEqualTypeOf<Address>();
            expectTypeOf<CreateAccountAccounts['newAccount']>().toEqualTypeOf<Address>();
        });
    });

    describe('program client with PDAs (ProgramMetadataProgramClient)', () => {
        test('should align with ProgramClient structure', () => {
            expectTypeOf<ProgramMetadataProgramClient>().toHaveProperty('instructions');
            expectTypeOf<ProgramMetadataProgramClient>().toHaveProperty('pdas');
            expectTypeOf<ProgramMetadataProgramClient['pdas']>().toEqualTypeOf<ProgramMetadataPdas>();
            expectTypeOf<ProgramMetadataProgramClient>().toHaveProperty('programAddress');
            expectTypeOf<ProgramMetadataProgramClient>().toHaveProperty('root');
        });

        test('should have a key for every PDA defined in the IDL', () => {
            type ExpectedPdaKeys = 'canonical' | 'metadata' | 'nonCanonical';
            expectTypeOf<keyof ProgramMetadataPdas>().toEqualTypeOf<ExpectedPdaKeys>();
            type PdaFn = ProgramMetadataPdas[keyof ProgramMetadataPdas];
            expectTypeOf<PdaFn>().returns.toEqualTypeOf<Promise<ProgramDerivedAddress>>();
            expectTypeOf<PdaFn>().parameter(1).toEqualTypeOf<{ programId?: Address } | undefined>();
        });

        test('should have correct seed properties on CanonicalSeeds', () => {
            expectTypeOf<CanonicalSeeds>().toHaveProperty('program');
            expectTypeOf<CanonicalSeeds['program']>().toEqualTypeOf<Address>();

            expectTypeOf<CanonicalSeeds>().toHaveProperty('seed');
            expectTypeOf<CanonicalSeeds['seed']>().toEqualTypeOf<string>();
        });

        test('should have correct seed properties on NonCanonicalSeeds', () => {
            expectTypeOf<NonCanonicalSeeds>().toHaveProperty('program');
            expectTypeOf<NonCanonicalSeeds['program']>().toEqualTypeOf<Address>();

            expectTypeOf<NonCanonicalSeeds>().toHaveProperty('authority');
            expectTypeOf<NonCanonicalSeeds['authority']>().toEqualTypeOf<Address>();

            expectTypeOf<NonCanonicalSeeds>().toHaveProperty('seed');
            expectTypeOf<NonCanonicalSeeds['seed']>().toEqualTypeOf<string>();
        });
    });

    describe('remainderOptionTypeNode optional args (pmp-idl)', () => {
        test('should have optional data in write args', () => {
            expectTypeOf<WriteInstructionDataArgs>().toMatchObjectType<{
                data?: Uint8Array | null;
                offset: bigint | number;
            }>();
        });

        test('should have optional seed in allocate args', () => {
            expectTypeOf<AllocateInstructionDataArgs>().toMatchObjectType<{ seed?: string | null }>();
        });
    });

    describe('zeroableOptionTypeNode optional args (token-2022)', () => {
        test('should have optional auditorElgamalPubkey in InitializeConfidentialTransferMintInstructionDataArgs', () => {
            expectTypeOf<InitializeConfidentialTransferMintInstructionDataArgs>().toMatchObjectType<{
                auditorElgamalPubkey?: Address | null;
                authority?: Address | null;
                autoApproveNewAccounts: boolean;
            }>();
        });
    });

    describe('resolved inputs (custom-resolvers-test-idl)', () => {
        test('should require accounts that were resolved in v1', () => {
            expectTypeOf<TransferWithResolverAccounts>().toEqualTypeOf<{
                authority: Address;
                destination: Address;
                treasury: Address | null;
            }>();
        });

        test('should require accounts whose v1 conditions were resolved', () => {
            expectTypeOf<ConditionalTransferAccounts>().toEqualTypeOf<{
                authority: Address;
                optionalTarget: Address | null;
                requiredTarget: Address;
            }>();
        });
    });
});
