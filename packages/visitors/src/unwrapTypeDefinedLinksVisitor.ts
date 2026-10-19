import { assertIsNode, isNode } from '@codama/nodes';
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
 *
 * The link of an `enumValueNode` names the enum its variant belongs to and
 * cannot be replaced by a type, so it is kept even when selected.
 */
export function unwrapTypeDefinedLinksVisitor(definedLinksType: string[]) {
    const linkables = new LinkableDictionary();

    const transformers: BottomUpNodeTransformerWithSelector[] = definedLinksType.map(selector => ({
        select: ['[definedTypeLinkNode]', selector],
        transform: (link, stack) => {
            assertIsNode(link, 'definedTypeLinkNode');
            const path = stack.getPath();
            if (isNode(path[path.length - 2], 'enumValueNode')) return link;
            const definedTypePath = linkables.getPathOrThrow(stack.getPath('definedTypeLinkNode'));
            return inlineDefinedType(link, getLastNodeFromPath(definedTypePath).type, {
                definedTypeProgram: findProgramNodeFromPath(definedTypePath)?.identifier,
                linkProgram: findProgramNodeFromPath(path)?.identifier,
            });
        },
    }));

    return pipe(bottomUpTransformerVisitor(transformers), v => recordLinkablesOnFirstVisitVisitor(v, linkables));
}
