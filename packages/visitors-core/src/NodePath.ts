import { Node } from '@codama/nodes';

export type NodePath<TNode extends Node = Node> = readonly [...Node[], TNode];

export function getLastNodeFromPath<TNode extends Node>(path: NodePath<TNode>): TNode {
    return path[path.length - 1] as TNode;
}
