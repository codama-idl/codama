import { assertIsNodeFilter, camelCase, CamelCaseString, programNode } from '@codama/nodes';
import {
    extendVisitor,
    findProgramNodeFromPath,
    getLastNodeFromPath,
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
    const typesToInlineCamelCased = (typesToInline === '*' ? [] : typesToInline).map(fullPath => {
        if (!fullPath.includes('.')) return camelCase(fullPath);
        const [programName, typeName] = fullPath.split('.');
        return `${camelCase(programName)}.${camelCase(typeName)}`;
    });
    const shouldInline = (typeName: CamelCaseString, programName: CamelCaseString | undefined): boolean => {
        if (typesToInline === '*') return true;
        const fullPath = `${programName}.${typeName}`;
        if (!!programName && typesToInlineCamelCased.includes(fullPath)) return true;
        return typesToInlineCamelCased.includes(typeName);
    };

    return pipe(
        nonNullableIdentityVisitor(),
        v =>
            extendVisitor(v, {
                visitDefinedTypeLink(linkType, { self }) {
                    const programName = linkType.program?.name ?? findProgramNodeFromPath(stack.getPath())?.name;
                    if (!shouldInline(linkType.name, programName)) {
                        return linkType;
                    }
                    const definedTypePath = linkables.getPathOrThrow(stack.getPath('definedTypeLinkNode'));
                    const definedType = getLastNodeFromPath(definedTypePath);

                    stack.pushPath(definedTypePath);
                    const result = visit(definedType.type, self);
                    stack.popPath();
                    return result;
                },

                visitProgram(program, { self }) {
                    return programNode({
                        ...program,
                        accounts: program.accounts
                            .map(account => visit(account, self))
                            .filter(assertIsNodeFilter('accountNode')),
                        definedTypes: program.definedTypes
                            .filter(definedType => !shouldInline(definedType.name, program.name))
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
