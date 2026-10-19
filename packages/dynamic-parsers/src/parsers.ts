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
import {
    AccountNode,
    EventNode,
    IdentifierString,
    InstructionAccountNode,
    InstructionNode,
    parseOptionalAccountStrategy,
    RootNode,
} from '@codama/nodes';
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

/**
 * Options of the parsers: how to identify the bytes and how to decode them. The
 * `resolvedDefaultValues` of the codecs are left out, since they only apply when encoding.
 */
export type ParseDataOptions = Omit<CodecVisitorOptions, 'resolvedDefaultValues'> & IdentifyDataOptions;

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

/**
 * The named accounts of a parsed instruction, each pairing its `AccountMeta` with its identifier,
 * in the order of the instruction. Only present accounts whose identity is certain are named.
 */
export type ParsedInstructionAccounts = ReadonlyArray<AccountMeta & { identifier: IdentifierString }>;

/**
 * A parsed instruction: its decoded node, plus the account metas of the instruction, split into
 * its named {@link ParsedInstructionAccounts}, its `unidentifiedAccounts` and its
 * `remainingAccounts`.
 *
 * - `accounts`: the present accounts whose identity is certain, each with its identifier.
 *   Optional accounts that are absent are left out, including those passed as the address of
 *   the program with the `programId` strategy, the default.
 * - `unidentifiedAccounts`: the account metas whose identity is ambiguous, which can only happen
 *   with the `omitted` strategy. Since absent optional accounts are left out, the accounts after
 *   them shift, so when several sets of optional accounts may be absent, or when remaining
 *   accounts may follow, the metas that could be different accounts are left unidentified
 *   rather than mislabelled.
 * - `remainingAccounts`: the account metas beyond all named accounts, e.g. the signers of a
 *   multisig.
 */
export type ParsedInstruction = DecodedInstructionNode & {
    readonly accounts: ParsedInstructionAccounts;
    readonly remainingAccounts: readonly (AccountLookupMeta | AccountMeta)[];
    readonly unidentifiedAccounts: readonly (AccountLookupMeta | AccountMeta)[];
};

/**
 * Parse an instruction, as defined in `@solana/instructions`: identify it within the program
 * of its `programAddress`, decode its data and name its accounts, following the
 * `optionalAccountStrategy` of the instruction, see {@link ParsedInstruction}.
 *
 * @example
 * ```ts
 * const parsed = parseInstruction(root, instruction);
 * parsed?.value; // { amount: 42n }
 * parsed?.accounts; // [{ address, role, identifier: 'source' }, …]
 * parsed?.unidentifiedAccounts; // [], unless optional accounts are omitted ambiguously
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
    return { ...decoded, ...identifyInstructionAccounts(getLastNodeFromPath(decoded.path), instruction) };
}

/**
 * Split the account metas of an instruction into named, unidentified and remaining accounts.
 *
 * With the `programId` strategy, every named account has a slot, so each meta is identified by
 * its position. With the `omitted` strategy, a meta is identified only if it is the same account,
 * or a remaining account, for every number of omitted optional accounts consistent with the
 * number of metas, and for every choice of the optional accounts omitted.
 */
function identifyInstructionAccounts(
    instructionNode: InstructionNode,
    instruction: ParsableInstruction,
): Pick<ParsedInstruction, 'accounts' | 'remainingAccounts' | 'unidentifiedAccounts'> {
    const namedAccounts = instructionNode.accounts ?? [];
    const isProgramIdStrategy = parseOptionalAccountStrategy(instructionNode.optionalAccountStrategy) === 'programId';
    const omittedCounts = isProgramIdStrategy
        ? [0]
        : getPossibleOmittedCounts(instructionNode, instruction.accounts.length);

    // For a given number of omitted optional accounts, the account at each position lies between
    // the ones found by omitting the last optional accounts and by omitting the first ones. So the
    // account at a position is certain when all these bounds agree, `null` marking positions
    // beyond the named accounts, i.e. remaining accounts.
    const bounds = omittedCounts.flatMap(omitted => [
        omitOptionalAccounts(namedAccounts, omitted, 'last'),
        omitOptionalAccounts(namedAccounts, omitted, 'first'),
    ]);

    const accounts: Array<AccountMeta & { identifier: IdentifierString }> = [];
    const remainingAccounts: Array<AccountLookupMeta | AccountMeta> = [];
    const unidentifiedAccounts: Array<AccountLookupMeta | AccountMeta> = [];
    instruction.accounts.forEach((meta, index) => {
        const candidates = new Set(bounds.map(present => present[index] ?? null));
        const [account] = candidates;
        if (candidates.size > 1 || account === undefined) {
            unidentifiedAccounts.push(meta);
        } else if (account === null) {
            remainingAccounts.push(meta);
        } else if (!(isProgramIdStrategy && account.isOptional && meta.address === instruction.programAddress)) {
            // With the `programId` strategy, an optional account holding the program address is absent.
            accounts.push({ ...meta, identifier: account.identifier });
        }
    });
    return { accounts, remainingAccounts, unidentifiedAccounts };
}

/**
 * The numbers of optional accounts that may be omitted, with the `omitted` strategy, given the
 * number of account metas. Without remaining accounts, the metas beyond the named accounts tell
 * how many optional accounts are omitted. With remaining accounts, any number of them may follow
 * the named accounts, so any number of optional accounts may be omitted, as long as the metas can
 * hold the named accounts that are left. When there are fewer metas than required accounts, the
 * instruction is malformed, so any number of optional accounts may be omitted.
 */
function getPossibleOmittedCounts(instructionNode: InstructionNode, metaCount: number): number[] {
    const namedAccounts = instructionNode.accounts ?? [];
    const optionalCount = namedAccounts.filter(account => account.isOptional).length;
    const minOmitted = Math.max(0, namedAccounts.length - metaCount);
    const hasRemainingAccounts = (instructionNode.remainingAccounts ?? []).length > 0;
    if (minOmitted > optionalCount) return getRange(0, optionalCount);
    return hasRemainingAccounts ? getRange(minOmitted, optionalCount) : [minOmitted];
}

/** The named accounts left after omitting the given number of optional accounts, either the first or the last ones. */
function omitOptionalAccounts(
    namedAccounts: readonly InstructionAccountNode[],
    omitted: number,
    which: 'first' | 'last',
): InstructionAccountNode[] {
    const ordered = which === 'first' ? [...namedAccounts] : [...namedAccounts].reverse();
    let left = omitted;
    const kept = ordered.filter(account => {
        if (left === 0 || !account.isOptional) return true;
        left -= 1;
        return false;
    });
    return which === 'first' ? kept : kept.reverse();
}

/** The integers from `start` to `end`, both included. */
function getRange(start: number, end: number): number[] {
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
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
