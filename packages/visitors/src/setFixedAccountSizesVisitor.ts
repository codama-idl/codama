import { accountNode, assertIsNode } from '@codama/nodes';
import {
    getByteSizeVisitor,
    getLastNodeFromPath,
    isNodePath,
    LinkableDictionary,
    NodeStack,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    recordNodeStackVisitor,
    topDownTransformerVisitor,
    visit,
} from '@codama/visitors-core';

export function setFixedAccountSizesVisitor() {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();
    const byteSizeVisitor = getByteSizeVisitor(linkables, stack);

    const visitor = topDownTransformerVisitor(
        [
            {
                select: path => isNodePath(path, 'accountNode') && getLastNodeFromPath(path).size === undefined,
                transform: node => {
                    assertIsNode(node, 'accountNode');
                    const size = visit(node.data, byteSizeVisitor);
                    if (size === null) return node;
                    return accountNode({ ...node, size }) as typeof node;
                },
            },
        ],
        ['rootNode', 'programNode', 'accountNode'],
    );

    return pipe(
        visitor,
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
