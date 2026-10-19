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
    InstructionRemainingAccountsNode,
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
import {
    type AccountLookupMeta,
    type AccountMeta,
    type Instruction,
    type InstructionWithAccounts,
    type InstructionWithData,
    isSignerRole,
    isWritableRole,
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
 *   rather than mislabelled. The roles of the metas narrow down the accounts they could be,
 *   since a meta never has fewer privileges than its account declares.
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
 * A meta is identified only if every placement of the metas consistent with the instruction
 * agrees on it, see {@link getAccountCandidates}. Placements are first required to respect the
 * roles of the accounts. If none does, the roles of the metas contradict the declared ones,
 * so placements are found regardless of roles instead.
 */
function identifyInstructionAccounts(
    instructionNode: InstructionNode,
    instruction: ParsableInstruction,
): Pick<ParsedInstruction, 'accounts' | 'remainingAccounts' | 'unidentifiedAccounts'> {
    const isProgramIdStrategy = parseOptionalAccountStrategy(instructionNode.optionalAccountStrategy) === 'programId';
    const candidatesByMeta =
        getAccountCandidates(instructionNode, instruction.accounts, { isProgramIdStrategy, useRoles: true }) ??
        getAccountCandidates(instructionNode, instruction.accounts, { isProgramIdStrategy, useRoles: false }) ??
        [];

    const accounts: Array<AccountMeta & { identifier: IdentifierString }> = [];
    const remainingAccounts: Array<AccountLookupMeta | AccountMeta> = [];
    const unidentifiedAccounts: Array<AccountLookupMeta | AccountMeta> = [];
    instruction.accounts.forEach((meta, index) => {
        const candidates = candidatesByMeta[index] ?? new Set();
        const [account] = candidates;
        if (candidates.size !== 1 || account === undefined) {
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
 * The accounts each meta may be, `null` marking a remaining account, over every placement of the
 * metas consistent with the instruction, or `undefined` if there is no such placement.
 *
 * A placement assigns the metas, in order, to the named accounts left after omitting some optional
 * accounts, which only the `omitted` strategy allows, followed by remaining accounts. Remaining
 * accounts may only follow every named account, and only when the instruction declares some,
 * except that metas beyond all named accounts are always remaining accounts. When there are fewer
 * metas than required accounts, the instruction is malformed, so the metas may stop at any account.
 *
 * With `useRoles`, a placement must also respect the roles of the accounts. Since the roles of an
 * account are merged across the instructions of a transaction, a meta may have more privileges
 * than its account declares, but never fewer: a signer account cannot hold a non-signer meta, and
 * a writable account cannot hold a read-only meta.
 *
 * Placements are counted with a forward and a backward reachability table over the states
 * `(i, j)`, where the first `i` named accounts hold the first `j` metas, so a meta may be a given
 * account if a placement reaches the state before it and completes from the state after it.
 */
function getAccountCandidates(
    instructionNode: InstructionNode,
    metas: readonly (AccountLookupMeta | AccountMeta)[],
    options: { isProgramIdStrategy: boolean; useRoles: boolean },
): Array<Set<InstructionAccountNode | null>> | undefined {
    const namedAccounts = instructionNode.accounts ?? [];
    const remainingAccounts = instructionNode.remainingAccounts ?? [];
    const [accountCount, metaCount] = [namedAccounts.length, metas.length];
    const canOmit = (account: InstructionAccountNode) => !options.isProgramIdStrategy && !!account.isOptional;
    const fits = (roles: AccountRoles, meta: AccountLookupMeta | AccountMeta) =>
        !options.useRoles || hasRoles(meta, roles);
    const canHold = (i: number, j: number) => j < metaCount && fits(namedAccounts[i], metas[j]);
    const isMalformed = metaCount < namedAccounts.filter(account => !canOmit(account)).length;

    // Whether the metas from `j` onwards can all be remaining accounts, after every named account.
    const tailFits = Array.from({ length: metaCount + 1 }, () => true);
    for (let j = metaCount - 1; j >= 0; j--) {
        const fitsRemaining =
            remainingAccounts.length > 0
                ? remainingAccounts.some(remaining => fits(remaining, metas[j]))
                : j >= accountCount;
        tailFits[j] = tailFits[j + 1] && fitsRemaining;
    }
    const isEnd = (i: number, j: number) => (i === accountCount && tailFits[j]) || (isMalformed && j === metaCount);

    const getTable = () => Array.from({ length: accountCount + 1 }, () => Array<boolean>(metaCount + 1).fill(false));
    const reached = getTable();
    reached[0][0] = true;
    for (let i = 0; i < accountCount; i++) {
        for (let j = 0; j <= metaCount; j++) {
            if (!reached[i][j]) continue;
            if (canOmit(namedAccounts[i])) reached[i + 1][j] = true;
            if (canHold(i, j)) reached[i + 1][j + 1] = true;
        }
    }
    const completes = getTable();
    for (let i = accountCount; i >= 0; i--) {
        for (let j = metaCount; j >= 0; j--) {
            completes[i][j] =
                isEnd(i, j) ||
                (i < accountCount &&
                    ((canOmit(namedAccounts[i]) && completes[i + 1][j]) || (canHold(i, j) && completes[i + 1][j + 1])));
        }
    }
    if (!completes[0][0]) return undefined;

    const candidates = metas.map(() => new Set<InstructionAccountNode | null>());
    for (let i = 0; i < accountCount; i++) {
        for (let j = 0; j < metaCount; j++) {
            if (reached[i][j] && canHold(i, j) && completes[i + 1][j + 1]) candidates[j].add(namedAccounts[i]);
        }
    }
    // Every meta from the first one that can start the remaining accounts may be a remaining account.
    const firstRemaining = reached[accountCount].findIndex((isReached, j) => isReached && tailFits[j]);
    if (firstRemaining >= 0) candidates.slice(firstRemaining).forEach(set => set.add(null));
    return candidates;
}

/** The roles an account declares, as both named and remaining accounts do. */
type AccountRoles = Pick<InstructionAccountNode | InstructionRemainingAccountsNode, 'isSigner' | 'isWritable'>;

/**
 * Whether a meta has the roles an account declares: a signer account needs a signer meta and a
 * writable account needs a writable meta. Accounts that may or may not sign, i.e. `'either'`,
 * accept any meta.
 */
function hasRoles(meta: AccountLookupMeta | AccountMeta, roles: AccountRoles): boolean {
    return (
        (roles.isSigner !== true || isSignerRole(meta.role)) && (roles.isWritable !== true || isWritableRole(meta.role))
    );
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
