import { assertIsNode, GetNodeFromKind, InstructionNode, isNode, Node, NodeKind, ProgramNode } from '@codama/nodes';

export type NodePath<TNode extends Node = Node> = readonly [...Node[], TNode];

export function getLastNodeFromPath<TNode extends Node>(path: NodePath<TNode>): TNode {
    return path[path.length - 1] as TNode;
}

export function findFirstNodeFromPath<TKind extends NodeKind>(
    path: NodePath,
    kind: TKind | TKind[],
): GetNodeFromKind<TKind> | undefined {
    return path.find(node => isNode(node, kind));
}

export function findLastNodeFromPath<TKind extends NodeKind>(
    path: NodePath,
    kind: TKind | TKind[],
): GetNodeFromKind<TKind> | undefined {
    for (let index = path.length - 1; index >= 0; index--) {
        const node = path[index];
        if (isNode(node, kind)) return node;
    }
    return undefined;
}

export function findProgramNodeFromPath(path: NodePath): ProgramNode | undefined {
    return findLastNodeFromPath(path, 'programNode');
}

export function findInstructionNodeFromPath(path: NodePath): InstructionNode | undefined {
    return findLastNodeFromPath(path, 'instructionNode');
}

export function getNodePathUntilLastNode<TKind extends NodeKind>(
    path: NodePath,
    kind: TKind | TKind[],
): NodePath<GetNodeFromKind<TKind>> | undefined {
    const lastIndex = (() => {
        for (let index = path.length - 1; index >= 0; index--) {
            const node = path[index];
            if (isNode(node, kind)) return index;
        }
        return -1;
    })();
    if (lastIndex === -1) return undefined;
    return path.slice(0, lastIndex + 1) as unknown as NodePath<GetNodeFromKind<TKind>>;
}

export function isNodePath<TKind extends NodeKind>(
    path: NodePath | null | undefined,
    kind: TKind | TKind[],
): path is NodePath<GetNodeFromKind<TKind>> {
    return isNode(path ? getLastNodeFromPath(path) : null, kind);
}

export function assertIsNodePath<TKind extends NodeKind>(
    path: NodePath | null | undefined,
    kind: TKind | TKind[],
): asserts path is NodePath<GetNodeFromKind<TKind>> {
    assertIsNode(path ? getLastNodeFromPath(path) : null, kind);
}
