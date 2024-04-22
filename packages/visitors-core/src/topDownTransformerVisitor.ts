import { Node, NodeKind } from '@kinobi-so/nodes';

import { identityVisitor } from './identityVisitor';
import { interceptVisitor } from './interceptVisitor';
import { getConjunctiveNodeSelectorFunction, NodeSelector } from './NodeSelector';
import { NodeStack } from './NodeStack';
import { pipe } from './pipe';
import { recordNodeStackVisitor } from './recordNodeStackVisitor';
import { Visitor } from './visitor';

export type TopDownNodeTransformer<TNode extends Node = Node> = <T extends TNode = TNode>(
    node: T,
    stack: NodeStack,
) => T | null;

export type TopDownNodeTransformerWithSelector<TNode extends Node = Node> = {
    select: NodeSelector | NodeSelector[];
    transform: TopDownNodeTransformer<TNode>;
};

export function topDownTransformerVisitor<TNodeKind extends NodeKind = NodeKind>(
    transformers: (TopDownNodeTransformer | TopDownNodeTransformerWithSelector)[],
    nodeKeys?: TNodeKind[],
): Visitor<Node | null, TNodeKind> {
    const transformerFunctions = transformers.map((transformer): TopDownNodeTransformer => {
        if (typeof transformer === 'function') return transformer;
        return (node, stack) =>
            getConjunctiveNodeSelectorFunction(transformer.select)(node, stack)
                ? transformer.transform(node, stack)
                : node;
    });

    const stack = new NodeStack();
    return pipe(
        identityVisitor(nodeKeys),
        v => recordNodeStackVisitor(v, stack),
        v =>
            interceptVisitor(v, (node, next) => {
                const appliedNode = transformerFunctions.reduce(
                    (acc, transformer) => (acc === null ? null : transformer(acc, stack.clone())),
                    node as Parameters<typeof next>[0] | null,
                );
                if (appliedNode === null) return null;
                return next(appliedNode);
            }),
    );
}
