import { accountNode, assertIsNode } from '@codama/nodes';
import {
    getByteSizeVisitor,
    getLastNodeFromPath,
    isNodePath,
    LinkableDictionary,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    topDownTransformerVisitor,
    visit,
} from '@codama/visitors-core';

export function setFixedAccountSizesVisitor() {
    const linkables = new LinkableDictionary();

    const visitor = topDownTransformerVisitor(
        [
            {
                select: path => isNodePath(path, 'accountNode') && getLastNodeFromPath(path).size === undefined,
                transform: (node, stack) => {
                    assertIsNode(node, 'accountNode');
                    const size = visit(node.data, getByteSizeVisitor(linkables, stack));
                    if (size === null) return node;
                    return accountNode({ ...node, size }) as typeof node;
                },
            },
        ],
        ['rootNode', 'programNode', 'accountNode'],
    );

    return pipe(visitor, v => recordLinkablesOnFirstVisitVisitor(v, linkables));
}
