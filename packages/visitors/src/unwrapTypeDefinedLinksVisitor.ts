import { assertIsNode } from '@kinobi-so/nodes';
import {
    BottomUpNodeTransformerWithSelector,
    bottomUpTransformerVisitor,
    LinkableDictionary,
    pipe,
    recordLinkablesVisitor,
} from '@kinobi-so/visitors-core';

export function unwrapTypeDefinedLinksVisitor(definedLinksType: string[]) {
    const linkables = new LinkableDictionary();

    const transformers: BottomUpNodeTransformerWithSelector[] = definedLinksType.map(selector => ({
        select: ['[definedTypeLinkNode]', selector],
        transform: node => {
            assertIsNode(node, 'definedTypeLinkNode');
            return linkables.getOrThrow(node).type;
        },
    }));

    return pipe(bottomUpTransformerVisitor(transformers), v => recordLinkablesVisitor(v, linkables));
}
