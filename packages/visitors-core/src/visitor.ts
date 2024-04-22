import { type GetNodeFromKind, type Node, type NodeKind, pascalCase, REGISTERED_NODE_KINDS } from '@kinobi-so/nodes';

export type Visitor<TReturn, TNodeKind extends NodeKind = NodeKind> = {
    [K in TNodeKind as GetVisitorFunctionName<K>]: (node: GetNodeFromKind<K>) => TReturn;
};

export type GetVisitorFunctionName<T extends Node['kind']> = T extends `${infer TWithoutNode}Node`
    ? `visit${Capitalize<TWithoutNode>}`
    : never;

export function visit<TReturn, TNode extends Node>(node: TNode, visitor: Visitor<TReturn, TNode['kind']>): TReturn {
    const key = getVisitFunctionName(node.kind) as GetVisitorFunctionName<TNode['kind']>;
    return (visitor[key] as (typeof visitor)[typeof key] & ((node: TNode) => TReturn))(node);
}

export function visitOrElse<TReturn, TNode extends Node, TNodeKind extends NodeKind>(
    node: TNode,
    visitor: Visitor<TReturn, TNodeKind>,
    fallback: (node: TNode) => TReturn,
): TReturn {
    const key = getVisitFunctionName<TNode['kind']>(node.kind);
    return (key in visitor ? (visitor[key] as (node: TNode) => TReturn) : fallback)(node);
}

export function getVisitFunctionName<TNodeKind extends NodeKind>(nodeKind: TNodeKind) {
    if (!REGISTERED_NODE_KINDS.includes(nodeKind)) {
        // TODO: Coded error.
        throw new Error(`Unrecognized node [${nodeKind}]`);
    }

    return `visit${pascalCase(nodeKind.slice(0, -4))}` as GetVisitorFunctionName<TNodeKind>;
}
