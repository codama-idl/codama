import type { NodeKind } from '@codama/nodes';

import { interceptVisitor, VisitorInterceptor } from './interceptVisitor';
import { Visitor } from './visitor';

export function interceptFirstVisitVisitor<TReturn, TNodeKind extends NodeKind>(
    visitor: Visitor<TReturn, TNodeKind>,
    interceptor: VisitorInterceptor<TReturn, TNodeKind>,
): Visitor<TReturn, TNodeKind> {
    let isFirstVisit = true;

    return interceptVisitor(visitor, (node, next, self) => {
        try {
            if (isFirstVisit) {
                isFirstVisit = false;
                const result = interceptor(node, next, self);
                isFirstVisit = true;
                return result;
            }
            return next(node);
        } catch (error) {
            isFirstVisit = true;
            throw error;
        }
    });
}
