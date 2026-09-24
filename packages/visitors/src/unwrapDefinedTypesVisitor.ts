import { assertIsNode, IdentifierString, programNode, TYPE_NODES } from '@codama/nodes';
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

import { inlineDefinedType } from './inlineDefinedTypeHelpers';

/**
 * Replace links to the given defined types with the types themselves and
 * remove the inlined defined types from their programs.
 *
 * Types are identified by `typeIdentifier` (in any program) or
 * `programIdentifier.typeIdentifier`, matched exactly. Use `'*'` to inline
 * every defined type.
 *
 * The link's own `transforms` are layered on top of the inlined type, and
 * links inside a type inlined into another program are qualified with the
 * type's original program.
 */
export function unwrapDefinedTypesVisitor(typesToInline: string[] | '*' = '*') {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();
    const shouldInline = (typeName: IdentifierString, programName: IdentifierString | undefined): boolean => {
        if (typesToInline === '*') return true;
        if (!!programName && typesToInline.includes(`${programName}.${typeName}`)) return true;
        return typesToInline.includes(typeName);
    };

    return pipe(
        nonNullableIdentityVisitor(),
        v =>
            extendVisitor(v, {
                visitDefinedTypeLink(link, { self }) {
                    const linkProgram = findProgramNodeFromPath(stack.getPath())?.identifier;
                    const definedTypeProgram = link.program?.identifier ?? linkProgram;
                    if (!shouldInline(link.identifier, definedTypeProgram)) {
                        return link;
                    }
                    const definedTypePath = linkables.getPathOrThrow(stack.getPath('definedTypeLinkNode'));
                    const definedType = getLastNodeFromPath(definedTypePath);

                    stack.pushPath(definedTypePath);
                    const type = visit(definedType.type, self);
                    stack.popPath();
                    assertIsNode(type, TYPE_NODES);

                    return inlineDefinedType(link, type, {
                        definedTypeProgram: findProgramNodeFromPath(definedTypePath)?.identifier,
                        linkProgram,
                    });
                },

                visitProgram(program, { next }) {
                    return next(
                        programNode({
                            ...program,
                            definedTypes: (program.definedTypes ?? []).filter(
                                definedType => !shouldInline(definedType.identifier, program.identifier),
                            ),
                        }),
                    );
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
