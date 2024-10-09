import { Node, NodeKind, REGISTERED_NODE_KINDS } from '@codama/nodes';

import { getVisitFunctionName, GetVisitorFunctionName, Visitor } from './visitor';

export type VisitorInterceptor<TReturn> = <TNode extends Node>(node: TNode, next: (node: TNode) => TReturn) => TReturn;

export function interceptVisitor<TReturn, TNodeKind extends NodeKind>(
    visitor: Visitor<TReturn, TNodeKind>,
    interceptor: VisitorInterceptor<TReturn>,
): Visitor<TReturn, TNodeKind> {
    const registeredVisitFunctions = REGISTERED_NODE_KINDS.map(getVisitFunctionName);

    return Object.fromEntries(
        Object.keys(visitor).flatMap(key => {
            const castedKey = key as GetVisitorFunctionName<TNodeKind>;
            if (!registeredVisitFunctions.includes(castedKey)) {
                return [];
            }

            return [
                [
                    castedKey,
                    function interceptedVisitNode<TNode extends Node>(this: Visitor<TReturn, TNodeKind>, node: TNode) {
                        const baseFunction = visitor[castedKey] as (node: TNode) => TReturn;
                        return interceptor<TNode>(node, baseFunction.bind(this));
                    },
                ],
            ];
        }),
    ) as Visitor<TReturn, TNodeKind>;
}
