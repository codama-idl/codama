import fs from 'node:fs';
import path from 'node:path';

import { type Address, getAddressEncoder, getProgramDerivedAddress } from '@solana/addresses';
import { getOptionEncoder, getStructEncoder, getU32Encoder, getU64Encoder, none, some } from '@solana/codecs';
import {
    type Buffer as PmpBuffer,
    getBufferDecoder,
    getMetadataDecoder,
    type Metadata as PmpMetadata,
} from '@solana-program/program-metadata';

import type { SvmTestContext } from '../../svm-test-context';
import type { ProgramMetadataProgramClient } from '../generated/pmp-idl-types';
import { createTestProgramClient } from '../test-utils';

export const programClient = createTestProgramClient<ProgramMetadataProgramClient>('pmp-idl.json');
export const PMP_PROGRAM_ID = programClient.programAddress;
export const exampleProgramPath = path.join(__dirname, '../dumps/pmp.so');

/**
 * Creates a 16-byte seed buffer from a string for PDA derivation.
 *
 * PMP seeds are fixed-size 16-byte UTF-8 strings. If the input string is shorter
 * than 16 bytes, then we want to pad it with zeros. If longer, it's truncated.
 *
 * @param seed - The seed string (max 16 bytes UTF-8)
 * @returns A 16-byte Uint8Array
 */
export function encodeSeedForPda(seed: string): Uint8Array {
    const seedBytes = new TextEncoder().encode(seed);
    const buffer = new Uint8Array(16);
    buffer.set(seedBytes.slice(0, 16)); // Copy up to 16 bytes
    return buffer;
}

export function decodeBufferAccount(data: Uint8Array): PmpBuffer {
    const decoder = getBufferDecoder();
    return decoder.decode(data);
}

export function decodeMetadataAccount(data: Uint8Array): PmpMetadata {
    const decoder = getMetadataDecoder();
    return decoder.decode(data);
}

/**
 * Loads compiled PMP program binary located at '../dumps/pmp.so' into the test context at the specified program address.
 */
export function loadPmpProgram(ctx: SvmTestContext, programAddress: Address): void {
    const programPath = path.resolve(__dirname, '..', 'dumps', 'pmp.so');
    ctx.loadProgram(programAddress, programPath);
}

/** Helper for creating canonical Metadata. */
export async function initializeCanonicalMetadata(ctx: SvmTestContext, options?: { data?: Uint8Array; seed?: string }) {
    const seed = options?.seed ?? 'idl';
    const data = options?.data ?? new TextEncoder().encode('{"name":"test"}');
    const result = await setupCanonicalPda(ctx, seed);

    const initIx = await programClient.methods
        .initialize({
            compression: 'none',
            data,
            dataSource: 'direct',
            encoding: 'utf8',
            format: 'json',
            seed,
        })
        .accounts({
            authority: result.authority,
            program: result.programAddress,
            programData: result.programDataAddress,
        })
        .instruction();
    await ctx.sendInstruction(initIx, [result.authority]);

    return result;
}

/** Helper for creating non-canonical Metadata. */
export async function initializeNonCanonicalMetadata(
    ctx: SvmTestContext,
    options?: { data?: Uint8Array; seed?: string },
) {
    const seed = options?.seed ?? 'idl';
    const data = options?.data ?? new TextEncoder().encode('non-canonical data');
    const result = await setupNonCanonicalPda(ctx, seed);

    const initIx = await programClient.methods
        .initialize({
            compression: 'none',
            data,
            dataSource: 'direct',
            encoding: 'utf8',
            format: 'json',
            seed,
        })
        .accounts({
            authority: result.authority,
            program: result.programAddress,
            programData: null,
        })
        .instruction();
    await ctx.sendInstruction(initIx, [result.authority]);

    return result;
}

/**
 * Helper to create common required accounts for canonical PMP use cases.
 * - Creates Upgradable Program Accounts for LiteSVM.
 * - Creates a canonical PDA (program upgradeAuthority), i.e [programAddress, seed].
 */
export async function setupCanonicalPda(ctx: SvmTestContext, seed = 'idl') {
    const authority = await ctx.createFundedAccount();
    const testProgramAddress = await ctx.createAccount();

    const { programAddress, programDataAddress } = await setUpgradeableProgramAccounts(
        ctx,
        exampleProgramPath,
        testProgramAddress,
        authority,
    );

    const pda = await deriveCanonicalPda(programAddress, seed);
    ctx.airdropToAddress(pda, BigInt(10_000_000_000));

    return { authority, pda, programAddress, programDataAddress };
}

/**
 * Helper to create common required accounts for non-canonical PMP use cases.
 * - Creates Upgradable Program Accounts for LiteSVM.
 * - Creates a non-canonical PDA (arbitrary authority), i.e [programAddress, authority, seed].
 */
export async function setupNonCanonicalPda(ctx: SvmTestContext, seed = 'idl') {
    const authority = await ctx.createFundedAccount();
    const programDataAuthority = await ctx.createFundedAccount();
    const testProgramAddress = await ctx.createAccount();

    const { programAddress, programDataAddress } = await setUpgradeableProgramAccounts(
        ctx,
        exampleProgramPath,
        testProgramAddress,
        programDataAuthority,
    );

    const pda = await deriveNonCanonicalPda(programAddress, authority, seed);
    ctx.airdropToAddress(pda, BigInt(10_000_000_000));

    return { authority, pda, programAddress, programDataAddress, programDataAuthority };
}

/**
 * Manually creates BPF Loader Upgradeable accounts for a program in LiteSVM.
 * since LiteSVM's loadProgram() doesn't create ProgramData accounts
 *
 * This allows testing canonical vs non-canonical scenarios:
 * - Canonical: authority matches ProgramData.upgrade_authority
 * - Non-canonical: authority does NOT match ProgramData.upgrade_authority
 *
 * How it works:
 * - Derives the ProgramData address (PDA with seeds: [program_address])
 * - Reads the program bytecode from file
 * - Creates ProgramData account with custom authority + bytecode
 * - Creates Program account pointing to ProgramData
 * - Both accounts are owned by BPF Loader Upgradeable
 *
 * @param ctx - Test context
 * @param programBinaryPath - Path to program .so file
 * @param programAddress - Address of the program
 * @param upgradeAuthority - Authority to set in ProgramData account
 * @returns { programAddress, programDataAddress }
 */
export async function setUpgradeableProgramAccounts(
    ctx: SvmTestContext,
    programBinaryPath: string,
    programAddress: Address,
    upgradeAuthority: Address,
): Promise<{ programAddress: Address; programDataAddress: Address }> {
    const addressEncoder = getAddressEncoder();
    const [programDataAddress] = await getProgramDerivedAddress({
        programAddress: ctx.BPF_LOADER_UPGRADEABLE,
        seeds: [addressEncoder.encode(programAddress)],
    });

    const programDataAccountBytes = encodeProgramDataAccount(upgradeAuthority);
    const programBytes = fs.readFileSync(programBinaryPath);
    const programDataAccountData = new Uint8Array([...programDataAccountBytes, ...programBytes]);

    const rentExemptBalance = ctx.getMinimumBalanceForRentExemption(BigInt(programDataAccountData.length));
    ctx.setAccount(programDataAddress, {
        data: programDataAccountData,
        executable: false,
        lamports: rentExemptBalance,
        owner: ctx.BPF_LOADER_UPGRADEABLE,
    });

    const programAccountBytes = encodeProgramAccount(programDataAddress);
    ctx.setAccount(programAddress, {
        data: Uint8Array.from(programAccountBytes),
        executable: true,
        lamports: rentExemptBalance,
        owner: ctx.BPF_LOADER_UPGRADEABLE,
    });

    return { programAddress, programDataAddress };
}

/** Creates ProgramData Account for BPF Loader Upgradeable. */
function encodeProgramDataAccount(authority: Address | null) {
    const encoder = getStructEncoder([
        ['discriminator', getU32Encoder()],
        ['slot', getU64Encoder()],
        ['authority', getOptionEncoder(getAddressEncoder())],
    ]);

    return encoder.encode({
        authority: authority ? some(authority) : none(),
        discriminator: 3,
        slot: 0n,
    });
}

/** Creates a Program Account for BPF Loader Upgradeable. */
function encodeProgramAccount(programDataAddress: Address) {
    const encoder = getStructEncoder([
        ['discriminator', getU32Encoder()],
        ['programData', getAddressEncoder()],
    ]);

    return encoder.encode({
        discriminator: 2,
        programData: programDataAddress,
    });
}

/** Helper for allocating Buffer. Used for extending, closing or adding data */
export async function allocateBufferAccount(ctx: SvmTestContext) {
    const bufferAccount = await ctx.createFundedAccount();

    const allocateIx = await programClient.methods
        .allocate({ seed: null })
        .accounts({
            authority: bufferAccount,
            buffer: bufferAccount,
            program: null,
            programData: null,
        })
        .instruction();
    await ctx.sendInstruction(allocateIx, [bufferAccount]);

    return { bufferAccount };
}

/** Derives a canonical PDA (upgradeAuthority), i.e [programAddress, seed]. */
export async function deriveCanonicalPda(programAddress: Address, seed: string) {
    const seed16Bytes = encodeSeedForPda(seed);
    const addressEncoder = getAddressEncoder();
    const [pda] = await getProgramDerivedAddress({
        programAddress: programClient.programAddress,
        seeds: [addressEncoder.encode(programAddress), seed16Bytes],
    });

    return pda;
}

/** Derives a non-canonical PDA (arbitrary authority), i.e [programAddress, authority, seed]. */
export async function deriveNonCanonicalPda(programAddress: Address, authority: Address, seed: string) {
    const seed16Bytes = encodeSeedForPda(seed);
    const addressEncoder = getAddressEncoder();
    const [pda] = await getProgramDerivedAddress({
        programAddress: programClient.programAddress,
        seeds: [addressEncoder.encode(programAddress), addressEncoder.encode(authority), seed16Bytes],
    });

    return pda;
}
