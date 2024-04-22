import { GetNodeFromKind, NodeKind, RootNode } from '@kinobi-so/nodes';

import { getVisitFunctionName, GetVisitorFunctionName, Visitor } from './visitor';

export function singleNodeVisitor<TReturn, TNodeKey extends NodeKind = NodeKind>(
    key: TNodeKey,
    fn: (node: GetNodeFromKind<TNodeKey>) => TReturn,
): Visitor<TReturn, TNodeKey> {
    const visitor = {} as Visitor<TReturn, TNodeKey>;
    visitor[getVisitFunctionName(key)] = fn as unknown as Visitor<TReturn, TNodeKey>[GetVisitorFunctionName<TNodeKey>];

    return visitor;
}

export function rootNodeVisitor<TReturn = RootNode>(fn: (node: RootNode) => TReturn) {
    return singleNodeVisitor('rootNode', fn);
}
