import { assertIsNodeFilter, camelCase, CamelCaseString, programNode } from '@kinobi-so/nodes';
import {
    extendVisitor,
    LinkableDictionary,
    nonNullableIdentityVisitor,
    pipe,
    recordLinkablesVisitor,
    visit,
} from '@kinobi-so/visitors-core';

export function unwrapDefinedTypesVisitor(typesToInline: string[] | '*' = '*') {
    const linkables = new LinkableDictionary();
    const typesToInlineMainCased = typesToInline === '*' ? '*' : typesToInline.map(camelCase);
    const shouldInline = (definedType: CamelCaseString): boolean =>
        typesToInlineMainCased === '*' || typesToInlineMainCased.includes(definedType);

    return pipe(
        nonNullableIdentityVisitor(),
        v => recordLinkablesVisitor(v, linkables),
        v =>
            extendVisitor(v, {
                visitDefinedTypeLink(linkType, { self }) {
                    if (!shouldInline(linkType.name) || linkType.importFrom) {
                        return linkType;
                    }

                    const definedType = linkables.get(linkType);
                    if (definedType === undefined) {
                        throw new Error(
                            `Trying to inline missing defined type [${linkType.name}]. ` +
                                `Ensure this visitor starts from the root node to access all defined types.`,
                        );
                    }

                    return visit(definedType.type, self);
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
    );
}
