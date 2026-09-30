import { assertIsNode, Node, RootNode } from '@codama/nodes';
import {
    deduplicateIdenticalDefinedTypesVisitor,
    flattenInstructionDataVisitor,
    getCommonInstructionAccountDefaultRules,
    rootNodeVisitor,
    setFixedAccountSizesVisitor,
    setInstructionAccountDefaultValuesVisitor,
    transformU8ArraysToBytesVisitor,
    unwrapInstructionDataDefinedTypesVisitor,
    visit,
    Visitor,
} from '@codama/visitors';

import { extractPdasVisitor } from './extractPdasVisitor';

export function defaultVisitor() {
    return rootNodeVisitor(currentRoot => {
        let root: RootNode = currentRoot;
        const updateRoot = (visitor: Visitor<Node | null, 'rootNode'>) => {
            const newRoot = visit(root, visitor);
            assertIsNode(newRoot, 'rootNode');
            root = newRoot;
        };

        // PDAs.
        updateRoot(extractPdasVisitor());

        // Defined types.
        updateRoot(deduplicateIdenticalDefinedTypesVisitor());

        // Accounts.
        updateRoot(setFixedAccountSizesVisitor());

        // Instructions.
        updateRoot(setInstructionAccountDefaultValuesVisitor(getCommonInstructionAccountDefaultRules()));
        updateRoot(unwrapInstructionDataDefinedTypesVisitor());
        updateRoot(flattenInstructionDataVisitor());

        // Extras.
        updateRoot(transformU8ArraysToBytesVisitor());

        return root;
    });
}
