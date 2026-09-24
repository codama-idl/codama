import { assertIsNode } from '@codama/nodes';
import {
    BottomUpNodeTransformerWithSelector,
    bottomUpTransformerVisitor,
    findProgramNodeFromPath,
    getLastNodeFromPath,
    LinkableDictionary,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
} from '@codama/visitors-core';

import { inlineDefinedType } from './inlineDefinedTypeHelpers';

/**
 * Replace the `definedTypeLinkNode`s matching the given selectors with the
 * types they point to, keeping the defined types themselves.
 *
 * The link's own `transforms` are layered on top of the inlined type, and
 * links inside a type inlined into another program are qualified with the
 * type's original program.
 */
export function unwrapTypeDefinedLinksVisitor(definedLinksType: string[]) {
    const linkables = new LinkableDictionary();

    const transformers: BottomUpNodeTransformerWithSelector[] = definedLinksType.map(selector => ({
        select: ['[definedTypeLinkNode]', selector],
        transform: (link, stack) => {
            assertIsNode(link, 'definedTypeLinkNode');
            const definedTypePath = linkables.getPathOrThrow(stack.getPath('definedTypeLinkNode'));
            return inlineDefinedType(link, getLastNodeFromPath(definedTypePath).type, {
                definedTypeProgram: findProgramNodeFromPath(definedTypePath)?.identifier,
                linkProgram: findProgramNodeFromPath(stack.getPath())?.identifier,
            });
        },
    }));

    return pipe(bottomUpTransformerVisitor(transformers), v => recordLinkablesOnFirstVisitVisitor(v, linkables));
}
