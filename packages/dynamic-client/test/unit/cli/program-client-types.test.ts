import type { Address, ProgramDerivedAddress } from '@solana/addresses';
import type { Instruction } from '@solana/instructions';
import type { InstructionNode, RootNode } from 'codama';
import { describe, expectTypeOf, test } from 'vitest';

import type {
    CreateItemAccounts,
    CreateItemArgs,
    CreateItemResolvers,
    ResolverFn,
} from '../../programs/generated/custom-resolvers-test-idl-types';
import type {
    AllocateArgs,
    CanonicalPdaSeeds,
    NonCanonicalPdaSeeds,
    ProgramMetadataPdas,
    ProgramMetadataProgramClient,
    WriteArgs,
} from '../../programs/generated/pmp-idl-types';
import type {
    CreateAccountAccounts,
    CreateAccountArgs,
    CreateAccountMethod,
    SystemMethods,
    SystemProgramClient,
} from '../../programs/generated/system-program-idl-types';
import type { InitializeConfidentialTransferMintArgs } from '../../programs/generated/token-2022-idl-types';

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

            expectTypeOf<MethodsBuilder>().toHaveProperty('resolvers');
            expectTypeOf<MethodsBuilder['resolvers']>().returns.toEqualTypeOf<MethodsBuilder>();

            expectTypeOf<MethodsBuilder>().toHaveProperty('signers');
            expectTypeOf<MethodsBuilder['signers']>().returns.toEqualTypeOf<MethodsBuilder>();
        });

        test('should have correct properties on CreateAccountArgs', () => {
            expectTypeOf<CreateAccountArgs>().toHaveProperty('lamports');
            expectTypeOf<CreateAccountArgs['lamports']>().toEqualTypeOf<bigint | number>();

            expectTypeOf<CreateAccountArgs>().toHaveProperty('space');
            expectTypeOf<CreateAccountArgs['space']>().toEqualTypeOf<bigint | number>();

            expectTypeOf<CreateAccountArgs>().toHaveProperty('programAddress');
            expectTypeOf<CreateAccountArgs['programAddress']>().toEqualTypeOf<Address>();
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
        });

        test('should have correct seed properties on CanonicalPdaSeeds', () => {
            expectTypeOf<CanonicalPdaSeeds>().toHaveProperty('program');
            expectTypeOf<CanonicalPdaSeeds['program']>().toEqualTypeOf<Address>();

            expectTypeOf<CanonicalPdaSeeds>().toHaveProperty('seed');
            expectTypeOf<CanonicalPdaSeeds['seed']>().toEqualTypeOf<string>();
        });

        test('should have correct seed properties on NonCanonicalPdaSeeds', () => {
            expectTypeOf<NonCanonicalPdaSeeds>().toHaveProperty('program');
            expectTypeOf<NonCanonicalPdaSeeds['program']>().toEqualTypeOf<Address>();

            expectTypeOf<NonCanonicalPdaSeeds>().toHaveProperty('authority');
            expectTypeOf<NonCanonicalPdaSeeds['authority']>().toEqualTypeOf<Address>();

            expectTypeOf<NonCanonicalPdaSeeds>().toHaveProperty('seed');
            expectTypeOf<NonCanonicalPdaSeeds['seed']>().toEqualTypeOf<string>();
        });
    });

    describe('remainderOptionTypeNode optional args (pmp-idl)', () => {
        test('should have optional data in write args', () => {
            expectTypeOf<WriteArgs>().toMatchObjectType<{ data?: Uint8Array | null; offset: number }>();
        });

        test('should have optional seed in allocate args', () => {
            expectTypeOf<AllocateArgs>().toMatchObjectType<{ seed?: string | null }>();
        });
    });

    describe('zeroableOptionTypeNode optional args (token-2022)', () => {
        test('should have optional auditorElgamalPubkey in InitializeConfidentialTransferMintArgs', () => {
            expectTypeOf<InitializeConfidentialTransferMintArgs>().toMatchObjectType<{
                auditorElgamalPubkey?: Address | null;
                authority?: Address | null;
                autoApproveNewAccounts: boolean;
            }>();
        });
    });

    describe('resolver types', () => {
        test('should have expected resolver keys on CreateItemResolvers', () => {
            expectTypeOf<CreateItemResolvers>().toHaveProperty('resolveDescription');
            expectTypeOf<CreateItemResolvers['resolveDescription']>().toExtend<
                ResolverFn<CreateItemArgs, CreateItemAccounts>
            >();

            expectTypeOf<CreateItemResolvers>().toHaveProperty('resolveTags');
            expectTypeOf<CreateItemResolvers['resolveTags']>().toExtend<
                ResolverFn<CreateItemArgs, CreateItemAccounts>
            >();
        });
    });
});
