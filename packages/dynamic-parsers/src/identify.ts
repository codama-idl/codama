import { CodecAndValueVisitors, getCodecAndValueVisitors, ReadonlyUint8Array } from '@codama/dynamic-codecs';
import {
    AccountNode,
    EventNode,
    GetNodeFromKind,
    InstructionNode,
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

export function identifyAccountData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
): NodePath<AccountNode> | undefined {
    return identifyData(root, bytes, 'accountNode');
}

export function identifyEventData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
): NodePath<EventNode> | undefined {
    return identifyData(root, bytes, 'eventNode');
}

export function identifyInstructionData(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
): NodePath<InstructionNode> | undefined {
    return identifyData(root, bytes, 'instructionNode');
}

export function identifyData<TKind extends IdentifiableNodeKind>(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    kind?: TKind | TKind[],
): NodePath<GetNodeFromKind<TKind>> | undefined {
    const kinds = kind ?? (['accountNode', 'instructionNode', 'eventNode'] as TKind[]);

    const stack = new NodeStack();
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    const codecAndValueVisitors = getCodecAndValueVisitors(linkables, { stack });
    const visitor = getByteIdentificationVisitor(kinds, bytes, codecAndValueVisitors, { stack });

    const identified = visit(root, visitor);
    if (identified) return identified;

    // Fallback: When Node of given kind doesn't have a discriminator and is single then we can identify it.
    // Example: `Memo4c2pN8afCj432Lb7RMVKi9PbQnnW7ewFFaV3oAH` program with single instruction omits a discriminator.
    const candidates = getNodeCandidates(root.program, kinds);
    if (candidates.length !== 1 || candidates[0].discriminators?.length) return undefined;
    return [root, root.program, candidates[0]] as unknown as NodePath<GetNodeFromKind<TKind>>;
}

export function getByteIdentificationVisitor<TKind extends IdentifiableNodeKind>(
    kind: TKind | TKind[],
    bytes: ReadonlyUint8Array | Uint8Array,
    codecAndValueVisitors: CodecAndValueVisitors,
    options: { stack?: NodeStack } = {},
) {
    const stack = options.stack ?? new NodeStack();

    return pipe(
        {
            visitAccount(node) {
                if (!node.discriminators) return;
                const struct = resolveNestedTypeNode(node.data);
                const match = matchDiscriminators(bytes, node.discriminators, struct, codecAndValueVisitors);
                return match ? stack.getPath(node.kind) : undefined;
            },
            visitEvent(node) {
                if (!node.discriminators) return;
                const match = matchDiscriminators(
                    bytes,
                    node.discriminators,
                    resolveNestedTypeNode(node.data),
                    codecAndValueVisitors,
                );
                return match ? stack.getPath(node.kind) : undefined;
            },
            visitInstruction(node) {
                if (!node.discriminators) return;
                const struct = structTypeNodeFromInstructionArgumentNodes(node.arguments);
                const match = matchDiscriminators(bytes, node.discriminators, struct, codecAndValueVisitors);
                return match ? stack.getPath(node.kind) : undefined;
            },
            visitProgram(node) {
                for (const candidate of getNodeCandidates(node, kind)) {
                    const result = visit(candidate, this);
                    if (result) return result;
                }
            },
            visitRoot(node) {
                return visit(node.program, this);
            },
        } as Visitor<
            NodePath<GetNodeFromKind<TKind>> | undefined,
            'accountNode' | 'eventNode' | 'instructionNode' | 'programNode' | 'rootNode'
        >,
        v => recordNodeStackVisitor(v, stack),
    );
}

function getNodeCandidates(
    program: ProgramNode,
    kind: IdentifiableNodeKind | IdentifiableNodeKind[],
): (AccountNode | EventNode | InstructionNode)[] {
    return [...program.accounts, ...program.events, ...program.instructions].filter(isNodeFilter(kind));
}
