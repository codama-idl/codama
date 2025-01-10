import { assertIsNode, CamelCaseString, definedTypeLinkNode, isNode } from '@codama/nodes';
import { getRecordLinkablesVisitor, LinkableDictionary, rootNodeVisitor, visit } from '@codama/visitors-core';

import { getDefinedTypeHistogramVisitor } from './getDefinedTypeHistogramVisitor';
import { unwrapDefinedTypesVisitor } from './unwrapDefinedTypesVisitor';

export function unwrapInstructionArgsDefinedTypesVisitor() {
    return rootNodeVisitor(root => {
        const histogram = visit(root, getDefinedTypeHistogramVisitor());
        const linkables = new LinkableDictionary();
        visit(root, getRecordLinkablesVisitor(linkables));

        const definedTypesToInline = (Object.keys(histogram) as CamelCaseString[])
            // Get all defined types used exactly once as an instruction argument.
            .filter(key => (histogram[key].total ?? 0) === 1 && (histogram[key].directlyAsInstructionArgs ?? 0) === 1)
            // Filter out enums which are better defined as external types.
            .filter(key => {
                const names = key.split('.');
                const link = names.length == 2 ? definedTypeLinkNode(names[1], names[0]) : definedTypeLinkNode(key);
                const found = linkables.get([link]);
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
