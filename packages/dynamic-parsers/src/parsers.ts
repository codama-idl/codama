import { getNodeCodec, ReadonlyUint8Array } from '@codama/dynamic-codecs';
import { AccountNode, CamelCaseString, EventNode, GetNodeFromKind, InstructionNode, RootNode } from '@codama/nodes';
import { getLastNodeFromPath, NodePath } from '@codama/visitors-core';
import type {
    AccountLookupMeta,
    AccountMeta,
    Instruction,
    InstructionWithAccounts,
    InstructionWithData,
} from '@solana/instructions';

import { identifyData, IdentifyDataOptions } from './identify';

type ParsableNode = AccountNode | EventNode | InstructionNode;
type ParsableNodeKind = ParsableNode['kind'];

export type ParsedData<TNode extends ParsableNode> = {
    data: unknown;
    path: NodePath<TNode>;
};

export function parseAccountData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    options: IdentifyDataOptions = {},
): ParsedData<AccountNode> | undefined {
    return parseData(root, bytes, 'accountNode', options);
}

export function parseEventData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    options: IdentifyDataOptions = {},
): ParsedData<EventNode> | undefined {
    return parseData(root, bytes, 'eventNode', options);
}

export function parseInstructionData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    options: IdentifyDataOptions = {},
): ParsedData<InstructionNode> | undefined {
    return parseData(root, bytes, 'instructionNode', options);
}

export function parseData<TKind extends ParsableNodeKind>(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    kind?: TKind | TKind[],
    options: IdentifyDataOptions = {},
): ParsedData<GetNodeFromKind<TKind>> | undefined {
    const path = identifyData<TKind>(
        root,
        bytes,
        kind ?? (['accountNode', 'instructionNode', 'eventNode'] as TKind[]),
        options,
    );
    if (!path) return undefined;
    const codec = getNodeCodec(path as NodePath<ParsableNode>);
    try {
        return { data: codec.decode(bytes), path };
    } catch {
        // A discriminator can match while the full data does not conform (e.g. truncated or
        // corrupt bytes). Parsing is total: data that cannot be decoded is not parsable,
        // mirroring the `undefined` returned when nothing is identified.
        return undefined;
    }
}

/**
 * The parsed accounts of an instruction, each pairing its on-chain `AccountMeta` with its node name.
 */
export type ParsedInstructionAccounts = ReadonlyArray<AccountMeta & { name: CamelCaseString }>;

/**
 * A parsed instruction: its decoded data and node path, plus its resolved {@link ParsedInstructionAccounts}.
 *
 * `remainingAccounts` carries the concrete account metas beyond the instruction's named
 * accounts — the ones described by the instruction node's `remainingAccounts` groups (e.g.
 * multisig signers). Optional so hand-built values remain valid; `parseInstruction` always
 * sets it.
 */
export type ParsedInstruction = ParsedData<InstructionNode> & {
    accounts: ParsedInstructionAccounts;
    remainingAccounts?: readonly (AccountLookupMeta | AccountMeta)[];
};

export function parseInstruction(
    root: RootNode,
    instruction: Instruction &
        InstructionWithAccounts<readonly (AccountLookupMeta | AccountMeta)[]> &
        InstructionWithData<ReadonlyUint8Array>,
): ParsedInstruction | undefined {
    const parsedData = parseInstructionData(root, instruction.data, { programAddress: instruction.programAddress });
    if (!parsedData) return undefined;
    const instructionNode = getLastNodeFromPath(parsedData.path);
    const namedAccounts = instructionNode.accounts ?? [];
    const accounts: ParsedInstructionAccounts = namedAccounts.flatMap((account, index) => {
        const accountMeta = instruction.accounts[index];
        if (!accountMeta) return [];
        return [{ ...accountMeta, name: account.name }];
    });
    const remainingAccounts = instruction.accounts.slice(namedAccounts.length);
    return { ...parsedData, accounts, remainingAccounts };
}
