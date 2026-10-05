import { assertIsNode, GetNodeFromKind, InstructionNode, isNode, Node, NodeKind, ProgramNode } from '@codama/nodes';

/**
 * The nodes leading to a node, from the root to that node included.
 *
 * Without a node type, any list of nodes. With one, a list ending at a node of
 * that type. Unions are not distributed: `NodePath<AccountNode | PdaNode>` is a
 * path ending at either node, not one path type per member, so a path built
 * from a node only known as a union, e.g. `[...stack.getPath(), node]`, is
 * accepted.
 */
export type NodePath<TNode extends Node | undefined = undefined> = NodePathImpl<TNode, TNode>;

/**
 * Distributes over `TCheck` to tell paths without a node type apart, but ends
 * every path at the whole `TNode`, without `undefined`, so unions are not
 * split into one path type per member. Distributing, rather than checking
 * `[TNode] extends [undefined]`, keeps the type resolvable for generic node
 * types, e.g. `NodePath<TLinkNode>`.
 */
type NodePathImpl<TCheck, TNode> = TCheck extends undefined
    ? readonly Node[]
    : readonly [...(readonly Node[]), Exclude<TNode, undefined>];

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

export function isFilledNodePath(path: NodePath | null | undefined): path is NodePath<Node> {
    return !!path && path.length > 0;
}

export function isNodePath<TKind extends NodeKind>(
    path: NodePath | null | undefined,
    kind: TKind | TKind[],
): path is NodePath<GetNodeFromKind<TKind>> {
    return isNode(isFilledNodePath(path) ? getLastNodeFromPath<Node>(path) : null, kind);
}

export function assertIsNodePath<TKind extends NodeKind>(
    path: NodePath | null | undefined,
    kind: TKind | TKind[],
): asserts path is NodePath<GetNodeFromKind<TKind>> {
    assertIsNode(isFilledNodePath(path) ? getLastNodeFromPath<Node>(path) : null, kind);
}

export function nodePathToStringArray(path: NodePath): string[] {
    return path.map((node): string => {
        return 'identifier' in node ? `[${node.kind}]${node.identifier}` : `[${node.kind}]`;
    });
}

export function nodePathToString(path: NodePath): string {
    return nodePathToStringArray(path).join(' > ');
}
