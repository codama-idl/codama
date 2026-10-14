import {
    CodecVisitorOptions,
    DecodedAccountNode,
    DecodedEventNode,
    DecodedInstructionNode,
    getCodecAndValueVisitors,
    GetDecodedNodeFromKind,
    getNodeCodec,
    ReadonlyUint8Array,
} from '@codama/dynamic-codecs';
import { AccountNode, EventNode, IdentifierString, InstructionNode, RootNode } from '@codama/nodes';
import {
    getLastNodeFromPath,
    getLinkablesFromNode,
    LinkableDictionary,
    NodePath,
    NodeStack,
    ProvidedScope,
} from '@codama/visitors-core';
import type {
    AccountLookupMeta,
    AccountMeta,
    Instruction,
    InstructionWithAccounts,
    InstructionWithData,
} from '@solana/instructions';

import { matchDiscriminators } from './discriminators';
import { identifyData, IdentifyDataOptions } from './identify';

type ParsableNode = AccountNode | EventNode | InstructionNode;
type ParsableNodeKind = ParsableNode['kind'];

/** Options of the parsers: how to identify the bytes and how to decode them. */
export type ParseDataOptions = CodecVisitorOptions & IdentifyDataOptions;

/**
 * Identify the account of some bytes and decode them with it.
 *
 * @example
 * ```ts
 * const account = parseAccountData(root, bytes);
 * account?.value; // { discriminator: 1n, amount: 42n }
 * ```
 *
 * @see {@link parseData}
 */
export function parseAccountData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    options: ParseDataOptions = {},
): DecodedAccountNode | undefined {
    return parseData(root, bytes, 'accountNode', options);
}

/**
 * Identify the event of some bytes and decode them with it.
 *
 * @see {@link parseData}
 */
export function parseEventData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    options: ParseDataOptions = {},
): DecodedEventNode | undefined {
    return parseData(root, bytes, 'eventNode', options);
}

/**
 * Identify the instruction of some bytes and decode them with it.
 *
 * @see {@link parseData}
 */
export function parseInstructionData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    options: ParseDataOptions = {},
): DecodedInstructionNode | undefined {
    return parseData(root, bytes, 'instructionNode', options);
}

/**
 * Identify the account, event or instruction of some bytes and decode them with it, into a
 * decoded node carrying its path, its value and the decoded nodes of its data.
 *
 * Returns `undefined` when the bytes are unparsable: either nothing is identified, or the
 * identified node cannot decode them, e.g. truncated bytes whose discriminator matches.
 *
 * @example
 * ```ts
 * const parsed = parseData(root, bytes, ['accountNode', 'eventNode']);
 * parsed?.path; // [root, program, account]
 * parsed?.value; // { discriminator: 1n, amount: 42n }
 * parsed?.data; // the decoded struct, with its `fields`
 * ```
 */
export function parseData<TKind extends ParsableNodeKind>(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    kind?: TKind | TKind[],
    options: ParseDataOptions = {},
): GetDecodedNodeFromKind<TKind> | undefined {
    // Identifying and decoding share the linkable nodes of the tree, recorded once.
    const linkables = options.linkables ?? getLinkablesFromNode(root);
    const path = identifyData<TKind>(
        root,
        bytes,
        kind ?? (['accountNode', 'instructionNode', 'eventNode'] as TKind[]),
        { linkables, programAddress: options.programAddress },
    );
    if (!path) return undefined;
    const codec = getNodeCodec(path as NodePath<ParsableNode>, { bytesEncoding: options.bytesEncoding, linkables });
    try {
        return codec.decode(bytes) as GetDecodedNodeFromKind<TKind>;
    } catch {
        // A discriminator can match while the full data does not conform (e.g. truncated or
        // corrupt bytes). Parsing is total: data that cannot be decoded is not parsable,
        // mirroring the `undefined` returned when nothing is identified.
        return undefined;
    }
}

/**
 * An instruction that can be parsed, as defined in `@solana/instructions`: the address of its
 * program, its account metas and its data.
 */
export type ParsableInstruction = Instruction &
    InstructionWithAccounts<readonly (AccountLookupMeta | AccountMeta)[]> &
    InstructionWithData<ReadonlyUint8Array>;

/** The named accounts of a parsed instruction, each pairing its `AccountMeta` with its identifier. */
export type ParsedInstructionAccounts = ReadonlyArray<AccountMeta & { identifier: IdentifierString }>;

/**
 * A parsed instruction: its decoded node, plus its named {@link ParsedInstructionAccounts} and
 * the `remainingAccounts` beyond them, e.g. the signers of a multisig.
 */
export type ParsedInstruction = DecodedInstructionNode & {
    readonly accounts: ParsedInstructionAccounts;
    readonly remainingAccounts: readonly (AccountLookupMeta | AccountMeta)[];
};

/**
 * Parse an instruction, as defined in `@solana/instructions`: identify it within the program
 * of its `programAddress`, decode its data and name its accounts.
 *
 * @example
 * ```ts
 * const parsed = parseInstruction(root, instruction);
 * parsed?.value; // { amount: 42n }
 * parsed?.accounts; // [{ address, role, identifier: 'source' }, …]
 * parsed?.remainingAccounts; // [{ address, role }, …]
 * ```
 *
 * @see {@link parseData}
 */
export function parseInstruction(
    root: RootNode,
    instruction: ParsableInstruction,
    options: Omit<ParseDataOptions, 'programAddress'> = {},
): ParsedInstruction | undefined {
    const decoded = parseInstructionData(root, instruction.data, {
        bytesEncoding: options.bytesEncoding,
        linkables: options.linkables,
        programAddress: instruction.programAddress,
    });
    if (!decoded) return undefined;
    const namedAccounts = getLastNodeFromPath(decoded.path).accounts ?? [];
    const accounts: ParsedInstructionAccounts = namedAccounts.flatMap((account, index) => {
        const accountMeta = instruction.accounts[index];
        if (!accountMeta) return [];
        return [{ ...accountMeta, identifier: account.identifier }];
    });
    const remainingAccounts = instruction.accounts.slice(namedAccounts.length);
    return { ...decoded, accounts, remainingAccounts };
}

/**
 * Whether some bytes can be data of the account at the end of the given path, as far as its
 * discriminators tell, e.g. before decoding data that is expected to be that account, such as
 * the account a public key links to. Accounts without discriminators match any bytes, since
 * nothing identifies them.
 *
 * @example
 * ```ts
 * matchesAccountData([root, program, mintAccount], tokenAccountBytes); // false: not a mint
 * ```
 */
export function matchesAccountData(
    accountPath: NodePath<AccountNode>,
    bytes: ReadonlyUint8Array | Uint8Array,
    options: { linkables?: LinkableDictionary } = {},
): boolean {
    const account = getLastNodeFromPath(accountPath);
    const discriminators = account.discriminators ?? [];
    if (discriminators.length === 0) return true;
    const linkables = options.linkables ?? getLinkablesFromNode(accountPath[0]);
    const stack = new NodeStack(accountPath);
    const scope = new ProvidedScope();
    const context = { ...getCodecAndValueVisitors(linkables, { scope, stack }), linkables, scope, stack };
    return matchDiscriminators(bytes, discriminators, account.data, context);
}
