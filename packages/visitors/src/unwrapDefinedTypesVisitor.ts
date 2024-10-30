import { assertIsNodeFilter, camelCase, CamelCaseString, programNode } from '@codama/nodes';
import {
    extendVisitor,
    LinkableDictionary,
    NodeStack,
    nonNullableIdentityVisitor,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    recordNodeStackVisitor,
    visit,
} from '@codama/visitors-core';

export function unwrapDefinedTypesVisitor(typesToInline: string[] | '*' = '*') {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();
    const typesToInlineMainCased = typesToInline === '*' ? '*' : typesToInline.map(camelCase);
    const shouldInline = (definedType: CamelCaseString): boolean =>
        typesToInlineMainCased === '*' || typesToInlineMainCased.includes(definedType);

    return pipe(
        nonNullableIdentityVisitor(),
        v =>
            extendVisitor(v, {
                visitDefinedTypeLink(linkType, { self }) {
                    if (!shouldInline(linkType.name)) {
                        return linkType;
                    }
                    return visit(linkables.getOrThrow(linkType, stack).type, self);
                },

                visitProgram(program, { self }) {
                    return programNode({
                        ...program,
                        accounts: program.accounts
                            .map(account => visit(account, self))
                            .filter(assertIsNodeFilter('accountNode')),
                        definedTypes: program.definedTypes
                            .filter(definedType => !shouldInline(definedType.name))
                            .map(type => visit(type, self))
                            .filter(assertIsNodeFilter('definedTypeNode')),
                        instructions: program.instructions
                            .map(instruction => visit(instruction, self))
                            .filter(assertIsNodeFilter('instructionNode')),
                    });
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
