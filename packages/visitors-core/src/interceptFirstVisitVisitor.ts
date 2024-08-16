import type { NodeKind } from '@kinobi-so/nodes';

import { interceptVisitor, VisitorInterceptor } from './interceptVisitor';
import { Visitor } from './visitor';

export function interceptFirstVisitVisitor<TReturn, TNodeKind extends NodeKind>(
    visitor: Visitor<TReturn, TNodeKind>,
    interceptor: VisitorInterceptor<TReturn>,
): Visitor<TReturn, TNodeKind> {
    let isFirstVisit = true;

    return interceptVisitor(visitor, (node, next) => {
        try {
            if (isFirstVisit) {
                isFirstVisit = false;
                const result = interceptor(node, next);
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
