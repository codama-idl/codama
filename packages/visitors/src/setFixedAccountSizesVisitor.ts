import { accountNode, assertIsNode, isNode } from '@codama/nodes';
import {
    getByteSizeVisitor,
    LinkableDictionary,
    recordLinkablesVisitor,
    topDownTransformerVisitor,
    visit,
} from '@codama/visitors-core';

export function setFixedAccountSizesVisitor() {
    const linkables = new LinkableDictionary();
    const byteSizeVisitor = getByteSizeVisitor(linkables);

    const visitor = topDownTransformerVisitor(
        [
            {
                select: node => isNode(node, 'accountNode') && node.size === undefined,
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

    return recordLinkablesVisitor(visitor, linkables);
}
