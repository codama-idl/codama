import { amountTypeNode, assertIsNestedTypeNode, dateTimeTypeNode, solAmountTypeNode } from '@kinobi-so/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@kinobi-so/visitors-core';

export type NumberWrapper =
    | { decimals: number; kind: 'Amount'; unit?: string }
    | { kind: 'DateTime' }
    | { kind: 'SolAmount' };

type NumberWrapperMap = Record<string, NumberWrapper>;

export function setNumberWrappersVisitor(map: NumberWrapperMap) {
    return bottomUpTransformerVisitor(
        Object.entries(map).map(
            ([selectorStack, wrapper]): BottomUpNodeTransformerWithSelector => ({
                select: `${selectorStack}.[numberTypeNode]`,
                transform: node => {
                    assertIsNestedTypeNode(node, 'numberTypeNode');
                    switch (wrapper.kind) {
                        case 'DateTime':
                            return dateTimeTypeNode(node);
                        case 'SolAmount':
                            return solAmountTypeNode(node);
                        case 'Amount':
                            return amountTypeNode(node, wrapper.decimals, wrapper.unit);
                        default:
                            throw new Error(`Invalid number wrapper kind: ${wrapper}`);
                    }
                },
            }),
        ),
    );
}
