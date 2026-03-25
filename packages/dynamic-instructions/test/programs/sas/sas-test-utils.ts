import path from 'node:path';

import { type Address } from '@solana/addresses';
import { getMintSize } from '@solana-program/token-2022';
import {
    deriveAttestationPda,
    deriveCredentialPda,
    deriveSasAuthorityAddress,
    deriveSchemaMintPda,
    deriveSchemaPda,
    getSchemaDecoder,
} from 'sas-lib';

import type { SvmTestContext } from '../../svm-test-context';
import type { SolanaAttestationServiceProgramClient } from '../generated/sas-idl-types';
import { createTestProgramClient } from '../test-utils';

export const programClient = createTestProgramClient<SolanaAttestationServiceProgramClient>('sas-idl.json');

export function loadSasProgram(ctx: SvmTestContext) {
    const programPath = path.resolve(__dirname, '..', 'dumps', 'sas.so');
    ctx.loadProgram(programClient.programAddress, programPath);
}

/**
 * Compute the mint account space needed for TokenizedSchema.
 */
export function getSchemaMintSize(sasPda: Address, schemaMint: Address) {
    return getMintSize([{ __kind: 'GroupPointer', authority: sasPda, groupAddress: schemaMint }]);
}

/**
 * Compute the mint account space needed for TokenizedAttestation.
 */
export function getAttestationMintSize({
    sasPda,
    attestationMint,
    schemaMint,
    name,
    symbol,
    uri,
    attestationPda,
    schemaPda,
}: {
    attestationMint: Address;
    attestationPda: Address;
    name: string;
    sasPda: Address;
    schemaMint: Address;
    schemaPda: Address;
    symbol: string;
    uri: string;
}) {
    return getMintSize([
        { __kind: 'GroupMemberPointer', authority: sasPda, memberAddress: attestationMint },
        { __kind: 'NonTransferable' },
        { __kind: 'MetadataPointer', authority: sasPda, metadataAddress: attestationMint },
        { __kind: 'PermanentDelegate', delegate: sasPda },
        { __kind: 'MintCloseAuthority', closeAuthority: sasPda },
        {
            __kind: 'TokenMetadata',
            additionalMetadata: new Map<string, string>([
                ['attestation', attestationPda],
                ['schema', schemaPda],
            ]),
            mint: attestationMint,
            name,
            symbol,
            updateAuthority: sasPda,
            uri,
        },
        { __kind: 'TokenGroupMember', group: schemaMint, memberNumber: 1, mint: attestationMint },
    ]);
}

export async function createCredential(ctx: SvmTestContext, opts?: { name?: string; signers?: Address[] }) {
    const authority = ctx.createFundedAccount();
    const name = opts?.name ?? 'TestCredential';
    const signers = opts?.signers ?? [authority];

    const [credentialPda] = await deriveCredentialPda({ authority, name });

    const ix = await programClient.methods
        .createCredential({ name, signers })
        .accounts({ authority, credential: credentialPda, payer: authority })
        .instruction();

    ctx.sendInstruction(ix, [authority]);

    return { authority, credentialPda, name };
}

// https://github.com/solana-foundation/solana-attestation-service/blob/master/program/src/state/schema.rs#L26
export const SCHEMA_DATA_STRING_TYPE = 12;
export const SCHEMA_DATA_U8_TYPE = 0;

/**
 * Helper function to create a schema.
 * - Derives the schema PDA
 * - Sends the createSchema instruction
 * - Fetches and decodes the created schema account
 */
export async function createSchema(
    ctx: SvmTestContext,
    authority: Address,
    credentialPda: Address,
    opts?: { description?: string; fieldNames?: string[]; layout?: Uint8Array; name?: string; version?: number },
) {
    const description = opts?.description ?? '';
    const fieldNames = opts?.fieldNames ?? ['field1'];
    const layout = opts?.layout ?? new Uint8Array([SCHEMA_DATA_STRING_TYPE]);
    const name = opts?.name ?? 'TestSchema';
    const version = opts?.version ?? 1;

    const [schemaPda] = await deriveSchemaPda({ credential: credentialPda, name, version });
    const ix = await programClient.methods
        .createSchema({ description, fieldNames, layout, name })
        .accounts({ authority, credential: credentialPda, payer: authority, schema: schemaPda })
        .instruction();
    ctx.sendInstruction(ix, [authority]);

    const schemaData = ctx.requireEncodedAccount(schemaPda).data;
    const schema = getSchemaDecoder().decode(schemaData);

    return { name, schema, schemaData, schemaPda, version };
}

export async function createAttestation(
    ctx: SvmTestContext,
    authority: Address,
    credentialPda: Address,
    schemaPda: Address,
    opts?: { data?: Uint8Array; expiry?: bigint },
) {
    const data = opts?.data ?? new Uint8Array([0, 0, 0, 0]);
    const expiry = opts?.expiry ?? 0n;
    const nonce = ctx.createAccount();

    const [attestationPda] = await deriveAttestationPda({ credential: credentialPda, nonce, schema: schemaPda });

    const ix = await programClient.methods
        .createAttestation({ data, expiry, nonce })
        .accounts({
            attestation: attestationPda,
            authority,
            credential: credentialPda,
            payer: authority,
            schema: schemaPda,
        })
        .instruction();

    ctx.sendInstruction(ix, [authority]);

    return { attestationPda, nonce };
}

export async function tokenizeSchema(
    ctx: SvmTestContext,
    authority: Address,
    credentialPda: Address,
    schemaPda: Address,
) {
    const sasPda = await deriveSasAuthorityAddress();
    const [schemaMintPda] = await deriveSchemaMintPda({ schema: schemaPda });
    const maxSize = BigInt(getSchemaMintSize(sasPda, schemaMintPda));

    const ix = await programClient.methods
        .tokenizeSchema({ maxSize })
        .accounts({
            authority,
            credential: credentialPda,
            mint: schemaMintPda,
            payer: authority,
            sasPda,
            schema: schemaPda,
            tokenProgram: ctx.TOKEN_2022_PROGRAM_ADDRESS,
        })
        .instruction();

    ctx.sendInstruction(ix, [authority]);

    return { sasPda, schemaMintPda };
}
