import { assertIsNode, Node, RootNode } from '@kinobi-so/nodes';
import {
    deduplicateIdenticalDefinedTypesVisitor,
    flattenInstructionDataArgumentsVisitor,
    getCommonInstructionAccountDefaultRules,
    rootNodeVisitor,
    setFixedAccountSizesVisitor,
    setInstructionAccountDefaultValuesVisitor,
    transformU8ArraysToBytesVisitor,
    unwrapInstructionArgsDefinedTypesVisitor,
    visit,
    Visitor,
} from '@kinobi-so/visitors';

export function defaultVisitor() {
    return rootNodeVisitor(currentRoot => {
        let root: RootNode = currentRoot;
        const updateRoot = (visitor: Visitor<Node | null, 'rootNode'>) => {
            const newRoot = visit(root, visitor);
            assertIsNode(newRoot, 'rootNode');
            root = newRoot;
        };

        // Defined types.
        updateRoot(deduplicateIdenticalDefinedTypesVisitor());

        // Accounts.
        updateRoot(setFixedAccountSizesVisitor());

        // Instructions.
        updateRoot(setInstructionAccountDefaultValuesVisitor(getCommonInstructionAccountDefaultRules()));
        updateRoot(unwrapInstructionArgsDefinedTypesVisitor());
        updateRoot(flattenInstructionDataArgumentsVisitor());

        // Extras.
        updateRoot(transformU8ArraysToBytesVisitor());

        return root;
    });
}
