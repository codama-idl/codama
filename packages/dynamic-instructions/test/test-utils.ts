import { getNodeCodec, type ReadonlyUint8Array } from '@codama/dynamic-codecs';
import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { EncodedAccount, MaybeEncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';
import { generateKeyPairSigner } from '@solana/kit';
import {
    type AccountNode,
    camelCase,
    type InstructionNode,
    instructionNode,
    type NodePath,
    programNode,
    type ProvidedNode,
    rootNode,
} from 'codama';

import type { DisplayContext, ResolveAccountDataFn } from '../src/display/types';

export async function generateAddress(): Promise<Address> {
    const signer = await generateKeyPairSigner();
    return signer.address;
}

const FIXTURE_ADDRESS = '11111111111111111111111111111111' as Address;
const DEFAULT_INSTRUCTION = instructionNode({ accounts: [], arguments: [], name: 'noop' });

/** Wraps raw account bytes in a Kit {@link MaybeEncodedAccount} that exists, filling its metadata. */
export function encodedAccount(bytes: ReadonlyUint8Array): MaybeEncodedAccount {
    return {
        address: FIXTURE_ADDRESS,
        data: bytes as Uint8Array,
        executable: false,
        exists: true,
        lamports: 0n as EncodedAccount['lamports'],
        programAddress: FIXTURE_ADDRESS,
        space: BigInt(bytes.length),
    };
}

/**
 * Encodes an account's data with its real Codama codec, returning the encoded account and a
 * matching {@link ResolveAccountDataFn} that decodes its bytes — exercising the actual `accountLink`
 * decoding path rather than hand-rolled data.
 */
export function accountFixture(
    account: AccountNode,
    value: Record<string, unknown>,
    accountName = account.name,
): { encoded: MaybeEncodedAccount; resolveAccountData: ResolveAccountDataFn } {
    const root = makeRoot([], 'testProgram', [account]);
    const codec = getNodeCodec([root, root.program, account] as NodePath<AccountNode>);
    const bytes = codec.encode(value);
    return {
        encoded: encodedAccount(bytes),
        resolveAccountData: (name, data) =>
            name === camelCase(accountName) ? (codec.decode(data) as Record<string, unknown>) : null,
    };
}

/**
 * Builds a {@link ParsedInstruction} fixture from an instruction, decoded argument data, and named
 * account addresses. The instruction is wrapped in a fresh root so `path` is the real
 * `[root, program, instruction]` that display helpers walk to recover the node.
 */
export function parsedInstruction(
    overrides: {
        accounts?: ReadonlyArray<readonly [name: string, address: Address]>;
        data?: Record<string, unknown>;
        instruction?: InstructionNode;
    } = {},
): ParsedInstruction {
    const instruction = overrides.instruction ?? DEFAULT_INSTRUCTION;
    const root = makeRoot([instruction]);
    return {
        accounts: (overrides.accounts ?? []).map(([name, address]) => ({
            address,
            name: camelCase(name),
            role: AccountRole.READONLY,
        })),
        data: overrides.data ?? {},
        path: [root, root.program, instruction] as NodePath<InstructionNode>,
    };
}

/** Builds a {@link DisplayContext} with empty defaults, overridable per test. */
export function displayContext(overrides: Partial<DisplayContext> = {}): DisplayContext {
    return {
        parsedInstruction: parsedInstruction(),
        provides: new Map<string, ProvidedNode>(),
        resolveAccountData: () => null,
        resolveDefinedType: () => undefined,
        ...overrides,
    };
}

export function makeRoot(
    instructions: ReturnType<typeof instructionNode>[],
    name = 'testProgram',
    accounts: AccountNode[] = [],
) {
    return rootNode(
        programNode({
            accounts,
            instructions,
            name,
            publicKey: '11111111111111111111111111111111',
        }),
    );
}
