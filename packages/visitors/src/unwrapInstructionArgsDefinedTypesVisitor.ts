import { assertIsNode, CamelCaseString, getAllDefinedTypes, isNode } from '@kinobi-so/nodes';
import { rootNodeVisitor, visit } from '@kinobi-so/visitors-core';

import { getDefinedTypeHistogramVisitor } from './getDefinedTypeHistogramVisitor';
import { unwrapDefinedTypesVisitor } from './unwrapDefinedTypesVisitor';

export function unwrapInstructionArgsDefinedTypesVisitor() {
    return rootNodeVisitor(root => {
        const histogram = visit(root, getDefinedTypeHistogramVisitor());
        const allDefinedTypes = getAllDefinedTypes(root);

        const definedTypesToInline: string[] = Object.keys(histogram)
            // Get all defined types used exactly once as an instruction argument.
            .filter(
                name =>
                    (histogram[name as CamelCaseString].total ?? 0) === 1 &&
                    (histogram[name as CamelCaseString].directlyAsInstructionArgs ?? 0) === 1,
            )
            // Filter out enums which are better defined as external types.
            .filter(name => {
                const found = allDefinedTypes.find(type => type.name === name);
                return found && !isNode(found.type, 'enumTypeNode');
            });

        // Inline the identified defined types if any.
        if (definedTypesToInline.length > 0) {
            const inlineVisitor = unwrapDefinedTypesVisitor(definedTypesToInline);
            const newRoot = visit(root, inlineVisitor);
            assertIsNode(newRoot, 'rootNode');
            return newRoot;
        }

        return root;
    });
}
