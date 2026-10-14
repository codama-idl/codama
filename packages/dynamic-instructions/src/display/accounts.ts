import {
    type DecodedAccountNode,
    type DecodedPublicKeyTypeNode,
    type FormatDecodedNodeOptions,
    getNodeCodec,
    type ReadonlyUint8Array,
} from '@codama/dynamic-codecs';
import { matchesAccountData, type ParsedInstruction } from '@codama/dynamic-parsers';
import type { Address } from '@solana/addresses';
import {
    type AccountLinkNode,
    type AccountNode,
    findProgramNodeFromPath,
    getLastNodeFromPath,
    type LinkableDictionary,
    type NodePath,
    parseOptionalAccountStrategy,
} from 'codama';

import type { DisplayAccountMap } from './types';

/** What the display needs to read data: the parsed instruction, the tree's linkables and the available accounts. */
export type DisplayContext = {
    /** The options of the formatters, given by the caller. */
    readonly formatOptions: Omit<FormatDecodedNodeOptions, 'linkables' | 'resolveInjectedValue'>;
    readonly linkables: LinkableDictionary;
    readonly parsed: ParsedInstruction;
    /** The decoded data of an account, decoded with the account node at the end of the path, if available. */
    readonly readAccount: (address: Address, accountPath: NodePath<AccountNode>) => DecodedAccountNode | undefined;
};

/**
 * Create the function reading the decoded data of accounts from the given map. Each account is
 * decoded once per account node. Accounts missing from the map are reported to `onMissing`, e.g.
 * to fetch them, and accounts whose data does not match the discriminators of the account node,
 * or does not decode, are unavailable, so the display falls back as it does for missing data.
 */
export function createAccountReader(
    accounts: DisplayAccountMap,
    linkables: LinkableDictionary,
    onMissing?: (address: Address) => void,
): DisplayContext['readAccount'] {
    const decoded = new Map<Address, Map<AccountNode, DecodedAccountNode | null>>();
    return (address, accountPath) => {
        const account = accounts.get(address);
        if (!account) {
            onMissing?.(address);
            return undefined;
        }
        const accountNode = getLastNodeFromPath(accountPath);
        let byNode = decoded.get(address);
        if (!byNode) decoded.set(address, (byNode = new Map()));
        if (!byNode.has(accountNode)) byNode.set(accountNode, decodeAccount(account.data, accountPath, linkables));
        return byNode.get(accountNode) ?? undefined;
    };
}

function decodeAccount(
    data: ReadonlyUint8Array,
    accountPath: NodePath<AccountNode>,
    linkables: LinkableDictionary,
): DecodedAccountNode | null {
    // Another account at the address may decode into plausible values, so it must match the
    // discriminators of the expected account first, as when parsing account data.
    if (!matchesAccountData(accountPath, data, { linkables })) return null;
    try {
        return getNodeCodec(accountPath, { linkables }).decode(data);
    } catch {
        // As when parsing data, bytes that do not decode as the account are not presentable.
        return null;
    }
}

/**
 * The address of a named account of a parsed instruction, or `undefined` when it is omitted.
 *
 * Optional accounts are omitted either by leaving them out, with the `omitted` strategy, or by
 * passing the address of the program, with the `programId` strategy, the default. The parser
 * keeps that address in the slot, so it is treated as omitted here, rather than presented as a
 * real account.
 */
export function getAccountAddress(parsed: ParsedInstruction, identifier: string): Address | undefined {
    const address = parsed.accounts.find(account => account.identifier === identifier)?.address;
    if (address === undefined) return undefined;
    const instruction = getLastNodeFromPath(parsed.path);
    const account = (instruction.accounts ?? []).find(account => account.identifier === identifier);
    if (!account?.isOptional || parseOptionalAccountStrategy(instruction.optionalAccountStrategy) !== 'programId') {
        return address;
    }
    return address === findProgramNodeFromPath(parsed.path)?.publicKey ? undefined : address;
}

/** The decoded data of a named account of the instruction, using its `accountLink`, if available. */
export function getInstructionAccountData(context: DisplayContext, identifier: string): DecodedAccountNode | undefined {
    const { linkables, parsed } = context;
    const account = (getLastNodeFromPath(parsed.path).accounts ?? []).find(a => a.identifier === identifier);
    const address = getAccountAddress(parsed, identifier);
    if (!account?.accountLink || address === undefined) return undefined;
    return context.readAccount(address, linkables.getPathOrThrow([...parsed.path, account, account.accountLink]));
}

/** The decoded data of the account a public key links to, if available, e.g. to follow `mint.decimals`. */
export function getLinkedAccountData(
    context: DisplayContext,
    publicKey: DecodedPublicKeyTypeNode,
): DecodedAccountNode | undefined {
    const { accountLink } = getLastNodeFromPath(publicKey.path);
    if (!accountLink) return undefined;
    const accountPath = context.linkables.getPathOrThrow([...publicKey.path, accountLink] as NodePath<AccountLinkNode>);
    return context.readAccount(publicKey.value, accountPath);
}
