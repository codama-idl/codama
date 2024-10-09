import { assertIsNode } from '@codama/nodes';
import {
    BottomUpNodeTransformerWithSelector,
    bottomUpTransformerVisitor,
    LinkableDictionary,
    pipe,
    recordLinkablesVisitor,
} from '@codama/visitors-core';

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
