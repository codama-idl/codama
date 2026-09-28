import { NodeKind } from '@codama/nodes';

import { interceptVisitor } from './interceptVisitor';
import { NodeStack } from './NodeStack';
import { Visitor } from './visitor';

export function recordNodeStackVisitor<TReturn, TNodeKind extends NodeKind>(
    visitor: Visitor<TReturn, TNodeKind>,
    stack: NodeStack,
): Visitor<TReturn, TNodeKind> {
    return interceptVisitor(visitor, (node, next) => {
        stack.push(node);
        try {
            return next(node);
        } finally {
            stack.pop();
        }
    });
}
