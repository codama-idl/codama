import {
    addTypeNodeTransforms,
    assertIsNode,
    enumVariantTypeNode,
    isNode,
    REGISTERED_NODE_KINDS,
    StructTypeNode,
} from '@codama/nodes';
import {
    bottomUpTransformerVisitor,
    findProgramNodeFromPath,
    getLastNodeFromPath,
    getNodeSelectorFunction,
    getRecordLinkablesVisitor,
    LinkableDictionary,
    NodeSelectorFunction,
    NodeStack,
    rootNodeVisitor,
    visit,
} from '@codama/visitors-core';

import { getDefinedTypeHistogramVisitor } from './getDefinedTypeHistogramVisitor';
import { inlineDefinedType } from './inlineDefinedTypeHelpers';
import { unwrapDefinedTypesVisitor } from './unwrapDefinedTypesVisitor';

/**
 * Turn enum variants whose data is a tuple with a single struct item (or a
 * link to a struct) into variants whose data is that struct.
 *
 * The tuple's `transforms` are layered on top of the struct. Defined types
 * inlined this way are removed when nothing else uses them.
 *
 * @example
 * ```ts
 * // Before: enumVariantTypeNode('move', { data: tupleTypeNode([structTypeNode([...])]) })
 * // After:  enumVariantTypeNode('move', { data: structTypeNode([...]) })
 * unwrapTupleEnumWithSingleStructVisitor(['myEnum.move']);
 * ```
 */
export function unwrapTupleEnumWithSingleStructVisitor(enumsOrVariantsToUnwrap: string[] | '*' = '*') {
    const selectorFunctions: NodeSelectorFunction[] =
        enumsOrVariantsToUnwrap === '*'
            ? [() => true]
            : enumsOrVariantsToUnwrap.map(selector => getNodeSelectorFunction(selector));

    const shouldUnwrap = (stack: NodeStack): boolean =>
        selectorFunctions.some(selector => selector(stack.getPath(REGISTERED_NODE_KINDS)));

    return rootNodeVisitor(root => {
        const linkables = new LinkableDictionary();
        visit(root, getRecordLinkablesVisitor(linkables));
        const typesToPotentiallyUnwrap = new Set<string>();

        let newRoot = visit(
            root,
            bottomUpTransformerVisitor([
                {
                    select: '[enumVariantTypeNode]',
                    transform: (node, stack) => {
                        assertIsNode(node, 'enumVariantTypeNode');
                        if (!shouldUnwrap(stack)) return node;
                        const tuple = node.data;
                        if (!tuple || !isNode(tuple, 'tupleTypeNode')) return node;
                        const tupleItems = tuple.items ?? [];
                        if (tupleItems.length !== 1) return node;
                        const item = tupleItems[0];

                        let struct: StructTypeNode;
                        if (isNode(item, 'definedTypeLinkNode')) {
                            const definedTypePath = linkables.getPath([...stack.getPath(), item]);
                            if (!definedTypePath) return node;
                            const definedType = getLastNodeFromPath(definedTypePath);
                            if (!isNode(definedType.type, 'structTypeNode')) return node;
                            const definedTypeProgram = findProgramNodeFromPath(definedTypePath)?.identifier;
                            typesToPotentiallyUnwrap.add(`${definedTypeProgram}.${definedType.identifier}`);
                            struct = inlineDefinedType(item, definedType.type, {
                                definedTypeProgram,
                                linkProgram: findProgramNodeFromPath(stack.getPath())?.identifier,
                            }) as StructTypeNode;
                        } else if (isNode(item, 'structTypeNode')) {
                            struct = item;
                        } else {
                            return node;
                        }

                        return enumVariantTypeNode(node.identifier, {
                            ...node,
                            data: addTypeNodeTransforms(struct, tuple.transforms ?? []),
                        });
                    },
                },
            ]),
        );
        assertIsNode(newRoot, 'rootNode');

        // Remove the inlined defined types that are no longer used.
        const histogram = visit(newRoot, getDefinedTypeHistogramVisitor());
        const typesToUnwrap = [...typesToPotentiallyUnwrap].filter(
            key => !(key in histogram) || histogram[key as keyof typeof histogram].total === 0,
        );
        if (typesToUnwrap.length === 0) return newRoot;

        newRoot = visit(newRoot, unwrapDefinedTypesVisitor(typesToUnwrap));
        assertIsNode(newRoot, 'rootNode');
        return newRoot;
    });
}
