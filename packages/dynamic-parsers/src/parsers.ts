import { type EncodableNodes, getNodeCodec, ReadonlyUint8Array } from '@codama/dynamic-codecs';
import { AccountNode, CamelCaseString, EventNode, GetNodeFromKind, InstructionNode, RootNode } from '@codama/nodes';
import { getLastNodeFromPath, NodePath } from '@codama/visitors-core';
import type {
    AccountLookupMeta,
    AccountMeta,
    Instruction,
    InstructionWithAccounts,
    InstructionWithData,
} from '@solana/instructions';

import { identifyData } from './identify';

type ParsableNode = Extract<EncodableNodes, AccountNode | EventNode | InstructionNode>;
type ParsableNodeKind = ParsableNode['kind'];

export type ParsedData<TNode extends ParsableNode> = {
    data: unknown;
    path: NodePath<TNode>;
};

function findPathByName<TKind extends ParsableNodeKind>(
    root: RootNode,
    name: string,
    kind: TKind | readonly TKind[],
): NodePath<GetNodeFromKind<TKind>> | undefined {
    const kinds = new Set(Array.isArray(kind) ? kind : [kind]);

    if (kinds.has('accountNode' as TKind)) {
        const account = root.program.accounts.find(candidate => candidate.name === name);
        if (account) return [root, root.program, account] as unknown as NodePath<GetNodeFromKind<TKind>>;
    }

    if (kinds.has('eventNode' as TKind)) {
        const event = root.program.events.find(candidate => candidate.name === name);
        if (event) return [root, root.program, event] as unknown as NodePath<GetNodeFromKind<TKind>>;
    }

    if (kinds.has('instructionNode' as TKind)) {
        const instruction = root.program.instructions.find(candidate => candidate.name === name);
        if (instruction) return [root, root.program, instruction] as unknown as NodePath<GetNodeFromKind<TKind>>;
    }

    return undefined;
}

export function parseAccountData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
): ParsedData<AccountNode> | undefined {
    return parseData(root, bytes, 'accountNode');
}

export function parseEventData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
): ParsedData<EventNode> | undefined {
    return parseData(root, bytes, 'eventNode');
}

export function parseInstructionData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
): ParsedData<InstructionNode> | undefined {
    return parseData(root, bytes, 'instructionNode');
}

export function parseData<TKind extends ParsableNodeKind>(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    kind?: TKind | TKind[],
): ParsedData<GetNodeFromKind<TKind>> | undefined {
    const path = identifyData<TKind>(root, bytes, kind ?? (['accountNode', 'instructionNode', 'eventNode'] as TKind[]));
    if (!path) return undefined;
    const codec = getNodeCodec(path as NodePath<ParsableNode>);
    const data = codec.decode(bytes);
    return { data, path };
}

export function parseDataByName<TKind extends ParsableNodeKind>(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    name: string,
    kind?: TKind | TKind[],
): ParsedData<GetNodeFromKind<TKind>> | undefined {
    const path = findPathByName<TKind>(
        root,
        name,
        kind ?? (['accountNode', 'instructionNode', 'eventNode'] as TKind[]),
    );
    if (!path) return undefined;
    const codec = getNodeCodec(path as NodePath<ParsableNode>);
    const data = codec.decode(bytes);
    return { data, path };
}

type ParsedInstructionAccounts = ReadonlyArray<AccountMeta & { name: CamelCaseString }>;
type ParsedInstruction = ParsedData<InstructionNode> & { accounts: ParsedInstructionAccounts };

export function parseInstruction(
    root: RootNode,
    instruction: Instruction &
        InstructionWithAccounts<readonly (AccountLookupMeta | AccountMeta)[]> &
        InstructionWithData<ReadonlyUint8Array>,
): ParsedInstruction | undefined {
    const parsedData = parseInstructionData(root, instruction.data);
    if (!parsedData) return undefined;
    const instructionNode = getLastNodeFromPath(parsedData.path);
    const accounts: ParsedInstructionAccounts = instructionNode.accounts.flatMap((account, index) => {
        const accountMeta = instruction.accounts[index];
        if (!accountMeta) return [];
        return [{ ...accountMeta, name: account.name }];
    });
    return { ...parsedData, accounts };
}
