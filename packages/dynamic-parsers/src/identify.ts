import { CodecAndValueVisitors, getCodecAndValueVisitors, ReadonlyUint8Array } from '@codama/dynamic-codecs';
import {
    AccountNode,
    EventNode,
    getAllPrograms,
    GetNodeFromKind,
    InstructionNode,
    isNode,
    isNodeFilter,
    ProgramNode,
    resolveNestedTypeNode,
    RootNode,
    structTypeNodeFromInstructionArgumentNodes,
} from '@codama/nodes';
import {
    getRecordLinkablesVisitor,
    LinkableDictionary,
    NodePath,
    NodeStack,
    pipe,
    recordNodeStackVisitor,
    visit,
    Visitor,
} from '@codama/visitors-core';

import { matchDiscriminators } from './discriminators';

type IdentifiableNodeKind = 'accountNode' | 'eventNode' | 'instructionNode';

export type IdentifyDataOptions = {
    /**
     * When provided, restricts the search to the programs matching this address.
     * When no program matches the address, nothing is identified: bytes can
     * legitimately match several programs of the same root (e.g. a token
     * instruction and an ATA instruction sharing a one-byte discriminator), so
     * matching a program we know nothing about against another program's
     * candidates would confidently misattribute the data.
     */
    programAddress?: string;
};

export function identifyAccountData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    options: IdentifyDataOptions = {},
): NodePath<AccountNode> | undefined {
    return identifyData(root, bytes, 'accountNode', options);
}

export function identifyEventData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    options: IdentifyDataOptions = {},
): NodePath<EventNode> | undefined {
    return identifyData(root, bytes, 'eventNode', options);
}

export function identifyInstructionData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    options: IdentifyDataOptions = {},
): NodePath<InstructionNode> | undefined {
    return identifyData(root, bytes, 'instructionNode', options);
}

export function identifyData<TKind extends IdentifiableNodeKind>(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    kind?: TKind | TKind[],
    options: IdentifyDataOptions = {},
): NodePath<GetNodeFromKind<TKind>> | undefined {
    const kinds = kind ?? (['accountNode', 'instructionNode', 'eventNode'] as TKind[]);

    const stack = new NodeStack();
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    const codecAndValueVisitors = getCodecAndValueVisitors(linkables, { stack });
    const visitor = getByteIdentificationVisitor(kinds, bytes, codecAndValueVisitors, {
        programAddress: options.programAddress,
        stack,
    });

    const identified = visit(root, visitor);
    if (identified) return identified;

    // Fallback: When Node of given kind doesn't have a discriminator and is single then we can identify it.
    // Example: `Memo4c2pN8afCj432Lb7RMVKi9PbQnnW7ewFFaV3oAH` program with single instruction omits a discriminator.
    // Without a program address the fallback stays conservative (main program only): bytes alone
    // cannot tell which program a discriminator-less candidate belongs to.
    const fallbackPrograms = options.programAddress
        ? getCandidatePrograms(root, options.programAddress)
        : [root.program];
    for (const program of fallbackPrograms) {
        const candidates = getNodeCandidates(program, kinds);
        if (candidates.length !== 1 || candidates[0].discriminators?.length) continue;
        return [root, program, candidates[0]] as unknown as NodePath<GetNodeFromKind<TKind>>;
    }
    return undefined;
}

export function getByteIdentificationVisitor<TKind extends IdentifiableNodeKind>(
    kind: TKind | TKind[],
    bytes: ReadonlyUint8Array | Uint8Array,
    codecAndValueVisitors: CodecAndValueVisitors,
    options: IdentifyDataOptions & { stack?: NodeStack } = {},
) {
    const stack = options.stack ?? new NodeStack();
    const programAddress = options.programAddress;

    // Accounts, events, and instructions identify identically: match the bytes against the
    // candidate's discriminators over its data struct (arguments, for instructions).
    const identifyCandidate = (node: AccountNode | EventNode | InstructionNode) => {
        if (!node.discriminators) return undefined;
        const struct = isNode(node, 'instructionNode')
            ? structTypeNodeFromInstructionArgumentNodes(node.arguments ?? [])
            : resolveNestedTypeNode(node.data);
        const match = matchDiscriminators(bytes, node.discriminators, struct, codecAndValueVisitors);
        return match ? stack.getPath(node.kind) : undefined;
    };

    return pipe(
        {
            visitAccount: identifyCandidate,
            visitEvent: identifyCandidate,
            visitInstruction: identifyCandidate,
            visitProgram(node) {
                for (const candidate of getNodeCandidates(node, kind)) {
                    const result = visit(candidate, this);
                    if (result) return result;
                }
            },
            visitRoot(node) {
                for (const program of getCandidatePrograms(node, programAddress)) {
                    const result = visit(program, this);
                    if (result) return result;
                }
            },
        } as Visitor<
            NodePath<GetNodeFromKind<TKind>> | undefined,
            'accountNode' | 'eventNode' | 'instructionNode' | 'programNode' | 'rootNode'
        >,
        v => recordNodeStackVisitor(v, stack),
    );
}

function getCandidatePrograms(root: RootNode, programAddress?: string): ProgramNode[] {
    const programs = getAllPrograms(root);
    if (programAddress === undefined) return programs;
    return programs.filter(program => program.publicKey === programAddress);
}

function getNodeCandidates(
    program: ProgramNode,
    kind: IdentifiableNodeKind | IdentifiableNodeKind[],
): (AccountNode | EventNode | InstructionNode)[] {
    return [...(program.accounts ?? []), ...(program.events ?? []), ...(program.instructions ?? [])].filter(
        isNodeFilter(kind),
    );
}
