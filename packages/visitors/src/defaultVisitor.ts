import { assertIsNode, Node, RootNode } from '@kinobi-so/nodes';
import { rootNodeVisitor, visit, Visitor } from '@kinobi-so/visitors-core';

import { deduplicateIdenticalDefinedTypesVisitor } from './deduplicateIdenticalDefinedTypesVisitor';
import { flattenInstructionDataArgumentsVisitor } from './flattenInstructionDataArgumentsVisitor';
import { setFixedAccountSizesVisitor } from './setFixedAccountSizesVisitor';
import {
    getCommonInstructionAccountDefaultRules,
    setInstructionAccountDefaultValuesVisitor,
} from './setInstructionAccountDefaultValuesVisitor';
import { transformU8ArraysToBytesVisitor } from './transformU8ArraysToBytesVisitor';
import { unwrapInstructionArgsDefinedTypesVisitor } from './unwrapInstructionArgsDefinedTypesVisitor';

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
