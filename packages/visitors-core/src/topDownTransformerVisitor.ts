import { Node, NodeKind, REGISTERED_NODE_KINDS } from '@codama/nodes';

import { identityVisitor } from './identityVisitor';
import { interceptVisitor } from './interceptVisitor';
import { getConjunctiveNodeSelectorFunction, NodeSelector } from './NodeSelector';
import { NodeStack } from './NodeStack';
import { pipe } from './pipe';
import { recordNodeStackVisitor } from './recordNodeStackVisitor';
import { Visitor } from './visitor';

export type TopDownNodeTransformer = <TNode extends Node>(node: TNode, stack: NodeStack) => TNode | null;

export type TopDownNodeTransformerWithSelector = {
    select: NodeSelector | NodeSelector[];
    transform: TopDownNodeTransformer;
};

export function topDownTransformerVisitor<TNodeKind extends NodeKind = NodeKind>(
    transformers: (TopDownNodeTransformer | TopDownNodeTransformerWithSelector)[],
    options: { keys?: TNodeKind[]; stack?: NodeStack } = {},
): Visitor<Node | null, TNodeKind> {
    const transformerFunctions = transformers.map((transformer): TopDownNodeTransformer => {
        if (typeof transformer === 'function') return transformer;
        return (node, stack) =>
            getConjunctiveNodeSelectorFunction(transformer.select)(stack.getPath(REGISTERED_NODE_KINDS))
                ? transformer.transform(node, stack)
                : node;
    });

    const stack = options.stack ?? new NodeStack();
    return pipe(
        identityVisitor(options),
        v =>
            interceptVisitor(v, (node, next) => {
                const appliedNode = transformerFunctions.reduce(
                    (acc, transformer) => (acc === null ? null : transformer(acc, stack)),
                    node as Parameters<typeof next>[0] | null,
                );
                if (appliedNode === null) return null;
                return next(appliedNode);
            }),
        v => recordNodeStackVisitor(v, stack),
    );
}
