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
            if (node.importFrom) return node;
            const definedType = linkables.get(node);
            if (definedType === undefined) {
                throw new Error(
                    `Trying to inline missing defined type [${node.name}]. ` +
                        `Ensure this visitor starts from the root node to access all defined types.`,
                );
            }
            return definedType.type;
        },
    }));

    return pipe(bottomUpTransformerVisitor(transformers), v => recordLinkablesVisitor(v, linkables));
}
