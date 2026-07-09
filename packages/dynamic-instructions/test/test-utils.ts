import { getNodeCodec, type ReadonlyUint8Array } from '@codama/dynamic-codecs';
import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { EncodedAccount, MaybeEncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';
import { generateKeyPairSigner } from '@solana/kit';
import {
    type AccountNode,
    accountNode,
    camelCase,
    type DefinedTypeNode,
    getLastNodeFromPath,
    type InstructionNode,
    instructionNode,
    type NodePath,
    numberTypeNode,
    programNode,
    type ProvidedNode,
    type RootNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';

import type { DisplayContext, FetchAccountFn, ResolveAccountDataFn, ResolveDefinedTypeFn } from '../src/display/types';

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
 * Encodes a value against an {@link AccountNode} living in the given root, returning a
 * {@link MaybeEncodedAccount}. Used by orchestrator tests where the account must sit in the *same*
 * root as the instruction so the display layer can follow the instruction account's `accountLink`.
 */
export function encodeAccountData(
    root: RootNode,
    account: AccountNode,
    value: Record<string, unknown>,
): MaybeEncodedAccount {
    const codec = getNodeCodec([root, root.program, account] as NodePath<AccountNode>);
    return encodedAccount(codec.encode(value));
}

/** An {@link AccountNode} for a token mint carrying a single `decimals: u8` field. */
export function mintAccountNode(): AccountNode {
    return accountNode({
        data: structTypeNode([structFieldTypeNode({ name: 'decimals', type: numberTypeNode('u8') })]),
        name: 'mint',
    });
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
        consumedMemberNames: new Set<string>(),
        parsedInstruction: parsedInstruction(),
        provides: new Map<string, ProvidedNode>(),
        resolveAccountData: () => null,
        resolveDefinedType: () => undefined,
        ...overrides,
    };
}

/**
 * Builds a {@link DisplayContext} presenting the given instruction (wrapped in a fresh root).
 * Overrides are applied last.
 */
export function displayContextFor(
    instruction: InstructionNode,
    overrides: Partial<DisplayContext> = {},
): DisplayContext {
    return displayContext({ parsedInstruction: parsedInstruction({ instruction }), ...overrides });
}

/** The `[root, program, instruction]` path for an instruction within a root. */
export function instructionPathOf(root: RootNode, instruction: InstructionNode): NodePath<InstructionNode> {
    return [root, root.program, instruction] as NodePath<InstructionNode>;
}

/** Builds a {@link ResolveDefinedTypeFn} that resolves the given defined types by name. */
export function mockResolveDefinedType(...definedTypes: DefinedTypeNode[]): ResolveDefinedTypeFn {
    const byName = new Map(definedTypes.map(definedType => [definedType.name, definedType]));
    return linkPath => {
        const definedType = byName.get(getLastNodeFromPath(linkPath).name);
        return definedType ? ([definedType] as NodePath<DefinedTypeNode>) : undefined;
    };
}

/**
 * Builds a {@link FetchAccountFn} from a literal address-to-account mapping, keeping the fetched
 * account visible at the call site — e.g. `mockFetch([[MINT, mintAccount.encoded]])`. The encoded
 * accounts are produced by {@link accountFixture} so the display layer decodes them through the
 * real `accountLink` path; unknown addresses resolve to a non-existent account.
 */
export function mockFetch(entries: ReadonlyArray<readonly [Address, MaybeEncodedAccount]>): FetchAccountFn {
    const accounts = new Map(entries.map(([address, account]) => [address, { ...account, address }]));
    return address => Promise.resolve(accounts.get(address) ?? { address, exists: false });
}

export function makeRoot(
    instructions: ReturnType<typeof instructionNode>[],
    name = 'testProgram',
    accounts: AccountNode[] = [],
    definedTypes: DefinedTypeNode[] = [],
) {
    return rootNode(
        programNode({
            accounts,
            definedTypes,
            instructions,
            name,
            publicKey: '11111111111111111111111111111111',
        }),
    );
}

/**
 * Builds a {@link ParsedInstruction} for an instruction within a root, with the decoded data and
 * concrete account addresses supplied by the test. The node path mirrors what `parseInstruction`
 * returns: `[root, program, instruction]`.
 */
export function makeParsedInstruction(
    root: RootNode,
    instruction: InstructionNode,
    data: Record<string, unknown> = {},
    accountAddresses: ReadonlyMap<string, Address> = new Map(),
): ParsedInstruction {
    return {
        accounts: instruction.accounts.flatMap(account => {
            const address = accountAddresses.get(account.name);
            return address ? [{ address, name: account.name, role: AccountRole.READONLY }] : [];
        }),
        data,
        path: [root, root.program, instruction] as NodePath<InstructionNode>,
    };
}
