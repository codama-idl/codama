import { CodecAndValueVisitors, getCodecAndValueVisitors, ReadonlyUint8Array } from '@codama/dynamic-codecs';
import {
    AccountNode,
    EventNode,
    GetNodeFromKind,
    InstructionNode,
    isNodeFilter,
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

export function identifyData<TKind extends 'accountNode' | 'eventNode' | 'instructionNode'>(
    root: RootNode,
    bytes: ReadonlyUint8Array | Uint8Array,
    kind?: TKind | TKind[],
): NodePath<GetNodeFromKind<TKind>> | undefined {
    const stack = new NodeStack();
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    const codecAndValueVisitors = getCodecAndValueVisitors(linkables, { stack });
    const visitor = getByteIdentificationVisitor(
        kind ?? (['accountNode', 'instructionNode', 'eventNode'] as TKind[]),
        bytes,
        codecAndValueVisitors,
        { stack },
    );

    return visit(root, visitor);
}

export function getByteIdentificationVisitor<TKind extends 'accountNode' | 'eventNode' | 'instructionNode'>(
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
                const candidates = [...node.accounts, ...node.events, ...node.instructions].filter(isNodeFilter(kind));
                for (const candidate of candidates) {
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
