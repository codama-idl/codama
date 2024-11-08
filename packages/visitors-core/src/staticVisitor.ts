import { Node, NodeKind, REGISTERED_NODE_KINDS } from '@codama/nodes';

import { getVisitFunctionName, Visitor } from './visitor';

export function staticVisitor<TReturn, TNodeKind extends NodeKind = NodeKind>(
    fn: (node: Node) => TReturn,
    options: { keys?: TNodeKind[] } = {},
): Visitor<TReturn, TNodeKind> {
    const keys = options.keys ?? (REGISTERED_NODE_KINDS as TNodeKind[]);
    const visitor = {} as Visitor<TReturn>;
    keys.forEach(key => {
        visitor[getVisitFunctionName(key)] = fn.bind(visitor);
    });
    return visitor;
}
