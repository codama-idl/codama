import { CODAMA_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION, KinobiError } from '@codama/errors';
import { GetNodeFromKind, Node, NodeKind, REGISTERED_NODE_KINDS } from '@codama/nodes';

import { getVisitFunctionName, GetVisitorFunctionName, Visitor } from './visitor';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DontInfer<T> = T extends any ? T : never;

export type VisitorOverrideFunction<TReturn, TNodeKind extends NodeKind, TNode extends Node> = (
    node: TNode,
    scope: {
        next: (node: TNode) => TReturn;
        self: Visitor<TReturn, TNodeKind>;
    },
) => TReturn;

export type VisitorOverrides<TReturn, TNodeKind extends NodeKind> = {
    [K in TNodeKind as GetVisitorFunctionName<K>]?: VisitorOverrideFunction<TReturn, TNodeKind, GetNodeFromKind<K>>;
};

export function extendVisitor<TReturn, TNodeKind extends NodeKind>(
    visitor: Visitor<TReturn, TNodeKind>,
    overrides: DontInfer<VisitorOverrides<TReturn, TNodeKind>>,
): Visitor<TReturn, TNodeKind> {
    const registeredVisitFunctions = REGISTERED_NODE_KINDS.map(getVisitFunctionName);

    const overriddenFunctions = Object.fromEntries(
        Object.keys(overrides).flatMap(key => {
            if (!(registeredVisitFunctions as string[]).includes(key)) {
                return [];
            }

            const castedKey = key as GetVisitorFunctionName<TNodeKind>;

            if (!visitor[castedKey]) {
                throw new KinobiError(CODAMA_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION, {
                    visitFunction: castedKey,
                });
            }

            return [
                [
                    castedKey,
                    function extendedVisitNode<TNode extends Node>(this: Visitor<TReturn, TNodeKind>, node: TNode) {
                        const extendedFunction = overrides[castedKey] as VisitorOverrideFunction<
                            TReturn,
                            TNodeKind,
                            TNode
                        >;
                        const nextFunction = visitor[castedKey] as unknown as (node: TNode) => TReturn;
                        return extendedFunction.bind(this)(node, {
                            next: nextFunction.bind(this),
                            self: this,
                        });
                    },
                ],
            ];
        }),
    ) as Partial<Visitor<TReturn, TNodeKind>>;

    return {
        ...visitor,
        ...overriddenFunctions,
    };
}
