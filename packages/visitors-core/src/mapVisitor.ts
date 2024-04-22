import { GetNodeFromKind, NodeKind, REGISTERED_NODE_KINDS } from '@kinobi-so/nodes';

import { getVisitFunctionName, GetVisitorFunctionName, Visitor } from './visitor';

export function mapVisitor<TReturnFrom, TReturnTo, TNodeKind extends NodeKind>(
    visitor: Visitor<TReturnFrom, TNodeKind>,
    map: (from: TReturnFrom) => TReturnTo,
): Visitor<TReturnTo, TNodeKind> {
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
                    (node: GetNodeFromKind<TNodeKind>) =>
                        map((visitor[castedKey] as (node: GetNodeFromKind<TNodeKind>) => TReturnFrom)(node)),
                ],
            ];
        }),
    ) as unknown as Visitor<TReturnTo, TNodeKind>;
}
