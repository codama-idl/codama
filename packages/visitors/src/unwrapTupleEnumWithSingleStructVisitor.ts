import {
    assertIsNode,
    CamelCaseString,
    DefinedTypeNode,
    enumStructVariantTypeNode,
    getAllDefinedTypes,
    isNode,
    resolveNestedTypeNode,
    StructTypeNode,
    transformNestedTypeNode,
} from '@codama/nodes';
import {
    bottomUpTransformerVisitor,
    getNodeSelectorFunction,
    NodeSelectorFunction,
    NodeStack,
    rootNodeVisitor,
    visit,
} from '@codama/visitors-core';

import { getDefinedTypeHistogramVisitor } from './getDefinedTypeHistogramVisitor';
import { unwrapDefinedTypesVisitor } from './unwrapDefinedTypesVisitor';

export function unwrapTupleEnumWithSingleStructVisitor(enumsOrVariantsToUnwrap: string[] | '*' = '*') {
    const selectorFunctions: NodeSelectorFunction[] =
        enumsOrVariantsToUnwrap === '*'
            ? [() => true]
            : enumsOrVariantsToUnwrap.map(selector => getNodeSelectorFunction(selector));

    const shouldUnwrap = (stack: NodeStack): boolean => selectorFunctions.some(selector => selector(stack.getPath()));

    return rootNodeVisitor(root => {
        const typesToPotentiallyUnwrap: string[] = [];
        const definedTypes: Map<string, DefinedTypeNode> = new Map(
            getAllDefinedTypes(root).map(definedType => [definedType.name, definedType]),
        );

        let newRoot = visit(
            root,
            bottomUpTransformerVisitor([
                {
                    select: '[enumTupleVariantTypeNode]',
                    transform: (node, stack) => {
                        assertIsNode(node, 'enumTupleVariantTypeNode');
                        if (!shouldUnwrap(stack)) return node;
                        const tupleNode = resolveNestedTypeNode(node.tuple);
                        if (tupleNode.items.length !== 1) return node;
                        let item = tupleNode.items[0];
                        if (isNode(item, 'definedTypeLinkNode')) {
                            const definedType = definedTypes.get(item.name);
                            if (!definedType) return node;
                            if (!isNode(definedType.type, 'structTypeNode')) return node;
                            typesToPotentiallyUnwrap.push(item.name);
                            item = definedType.type;
                        }
                        if (!isNode(item, 'structTypeNode')) return node;
                        const nestedStruct = transformNestedTypeNode(node.tuple, () => item as StructTypeNode);
                        return enumStructVariantTypeNode(node.name, nestedStruct);
                    },
                },
            ]),
        );
        assertIsNode(newRoot, 'rootNode');

        const histogram = visit(newRoot, getDefinedTypeHistogramVisitor());
        const typesToUnwrap = typesToPotentiallyUnwrap.filter(
            type => !histogram[type as CamelCaseString] || histogram[type as CamelCaseString].total === 0,
        );

        newRoot = visit(newRoot, unwrapDefinedTypesVisitor(typesToUnwrap));
        assertIsNode(newRoot, 'rootNode');

        return newRoot;
    });
}
