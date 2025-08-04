import { Node, NodeKind, REGISTERED_NODE_KINDS } from '@codama/nodes';

import { identityVisitor } from './identityVisitor';
import { interceptVisitor } from './interceptVisitor';
import { getConjunctiveNodeSelectorFunction, NodeSelector } from './NodeSelector';
import { NodeStack } from './NodeStack';
import { pipe } from './pipe';
import { recordNodeStackVisitor } from './recordNodeStackVisitor';
import { Visitor } from './visitor';

export type BottomUpNodeTransformer = (node: Node, stack: NodeStack) => Node | null;

export type BottomUpNodeTransformerWithSelector = {
    select: NodeSelector | NodeSelector[];
    transform: BottomUpNodeTransformer;
};

export function bottomUpTransformerVisitor<TNodeKind extends NodeKind = NodeKind>(
    transformers: (BottomUpNodeTransformer | BottomUpNodeTransformerWithSelector)[],
    options: { keys?: TNodeKind[]; stack?: NodeStack } = {},
): Visitor<Node | null, TNodeKind> {
    const transformerFunctions = transformers.map((transformer): BottomUpNodeTransformer => {
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
                return transformerFunctions.reduce(
                    (acc, transformer) => (acc === null ? null : transformer(acc, stack)),
                    next(node),
                );
            }),
        v => recordNodeStackVisitor(v, stack),
    );
}
