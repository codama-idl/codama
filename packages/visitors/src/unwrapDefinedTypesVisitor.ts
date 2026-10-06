import { assertIsNode, DefinedTypeNode, IdentifierString, programNode, TYPE_NODES } from '@codama/nodes';
import {
    extendVisitor,
    findProgramNodeFromPath,
    getDefinedTypeLinksVisitor,
    getLastNodeFromPath,
    LinkableDictionary,
    NodePath,
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
 *
 * Defined types in a cycle made only of types to inline (e.g.
 * `node = struct { next: option<link(node)> }`) cannot be inlined, since
 * inlining would never end: they are kept, and so are the links to them.
 * Cycles going through a type that is not inlined end at its link, so their
 * other types are inlined as usual.
 */
export function unwrapDefinedTypesVisitor(typesToInline: string[] | '*' = '*') {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();
    const shouldInline = (typeName: IdentifierString, programName: IdentifierString | undefined): boolean => {
        if (typesToInline === '*') return true;
        if (!!programName && typesToInline.includes(`${programName}.${typeName}`)) return true;
        return typesToInline.includes(typeName);
    };

    // Whether the defined type links back to itself through types to inline only, in which case
    // inlining it would never end. Linkables are recorded once, on the first visit, so it is cached.
    const linksStack = new NodeStack();
    const linksVisitor = getDefinedTypeLinksVisitor(linkables, { stack: linksStack });
    const inlinedCycles = new Map<DefinedTypeNode, boolean>();
    const isInInlinedCycle = (path: NodePath<DefinedTypeNode>): boolean => {
        const target = getLastNodeFromPath(path);
        if (inlinedCycles.has(target)) return inlinedCycles.get(target)!;
        let cyclic = false;
        const followed = new Set<DefinedTypeNode>();
        const pending = [path];
        while (!cyclic && pending.length > 0) {
            for (const linkedPath of linksStack.visitPath(pending.pop()!, linksVisitor)) {
                const linkedType = getLastNodeFromPath(linkedPath);
                if (!shouldInline(linkedType.identifier, findProgramNodeFromPath(linkedPath)?.identifier)) continue;
                if (linkedType === target) {
                    cyclic = true;
                    break;
                }
                if (followed.has(linkedType)) continue;
                followed.add(linkedType);
                pending.push(linkedPath);
            }
        }
        inlinedCycles.set(target, cyclic);
        return cyclic;
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
                    if (isInInlinedCycle(definedTypePath)) return link;
                    const definedType = getLastNodeFromPath(definedTypePath);

                    const type = stack.withPath(definedTypePath, () => visit(definedType.type, self));
                    assertIsNode(type, TYPE_NODES);

                    return inlineDefinedType(link, type, {
                        definedTypeProgram: findProgramNodeFromPath(definedTypePath)?.identifier,
                        linkProgram,
                    });
                },

                visitProgram(program, { next }) {
                    const programPath = stack.getPath('programNode');
                    return next(
                        programNode({
                            ...program,
                            definedTypes: (program.definedTypes ?? []).filter(
                                definedType =>
                                    !shouldInline(definedType.identifier, program.identifier) ||
                                    isInInlinedCycle([...programPath, definedType]),
                            ),
                        }),
                    );
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
