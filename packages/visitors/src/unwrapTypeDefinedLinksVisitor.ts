import {
    BottomUpNodeTransformerWithSelector,
    bottomUpTransformerVisitor,
    LinkableDictionary,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
} from '@codama/visitors-core';

export function unwrapTypeDefinedLinksVisitor(definedLinksType: string[]) {
    const linkables = new LinkableDictionary();

    const transformers: BottomUpNodeTransformerWithSelector[] = definedLinksType.map(selector => ({
        select: ['[definedTypeLinkNode]', selector],
        transform: (_, stack) => {
            const definedType = linkables.getOrThrow(stack.getPath('definedTypeLinkNode'));
            return definedType.type;
        },
    }));

    return pipe(bottomUpTransformerVisitor(transformers), v => recordLinkablesOnFirstVisitVisitor(v, linkables));
}
