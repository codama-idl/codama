import {
    assertIsNode,
    DefinedTypeLinkNode,
    definedTypeLinkNode,
    IdentifierString,
    isNode,
    programLinkNode,
} from '@codama/nodes';
import { getRecordLinkablesVisitor, LinkableDictionary, rootNodeVisitor, visit } from '@codama/visitors-core';

import { getDefinedTypeHistogramVisitor } from './getDefinedTypeHistogramVisitor';
import { unwrapDefinedTypesVisitor } from './unwrapDefinedTypesVisitor';

/**
 * Inline the defined types that are used exactly once in the whole IDL,
 * either as an instruction's `data` or as the type of one of its top-level
 * data fields. Enums are kept as defined types.
 */
export function unwrapInstructionDataDefinedTypesVisitor() {
    return rootNodeVisitor(root => {
        const histogram = visit(root, getDefinedTypeHistogramVisitor());
        const linkables = new LinkableDictionary();
        visit(root, getRecordLinkablesVisitor(linkables));

        const definedTypesToInline = (Object.keys(histogram) as IdentifierString[])
            // Get all defined types used exactly once, directly as instruction data.
            .filter(key => histogram[key].total === 1 && histogram[key].directlyAsInstructionData === 1)
            // Filter out enums which are better defined as external types.
            .filter(key => {
                const [programName, typeName] = key.split('.');
                const link: DefinedTypeLinkNode =
                    typeName === undefined
                        ? definedTypeLinkNode(programName)
                        : definedTypeLinkNode(typeName, { program: programLinkNode(programName) });
                const found = linkables.get([link]);
                return found && !isNode(found.type, 'enumTypeNode');
            });

        // Inline the identified defined types if any.
        if (definedTypesToInline.length > 0) {
            const newRoot = visit(root, unwrapDefinedTypesVisitor(definedTypesToInline));
            assertIsNode(newRoot, 'rootNode');
            return newRoot;
        }

        return root;
    });
}
