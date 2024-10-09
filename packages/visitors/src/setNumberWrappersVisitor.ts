import { CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER, KinobiError } from '@codama/errors';
import { amountTypeNode, assertIsNestedTypeNode, dateTimeTypeNode, solAmountTypeNode } from '@codama/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@codama/visitors-core';

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
                            throw new KinobiError(CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER, { wrapper });
                    }
                },
            }),
        ),
    );
}
