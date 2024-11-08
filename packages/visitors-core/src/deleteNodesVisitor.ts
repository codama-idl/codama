import { NodeKind } from '@codama/nodes';

import { NodeSelector } from './NodeSelector';
import { TopDownNodeTransformerWithSelector, topDownTransformerVisitor } from './topDownTransformerVisitor';

export function deleteNodesVisitor<TNodeKind extends NodeKind = NodeKind>(
    selectors: NodeSelector[],
    options?: Parameters<typeof topDownTransformerVisitor<TNodeKind>>[1],
) {
    return topDownTransformerVisitor<TNodeKind>(
        selectors.map(
            (selector): TopDownNodeTransformerWithSelector => ({
                select: selector,
                transform: () => null,
            }),
        ),
        options,
    );
}
