import { assertIsNode, errorNode, ErrorNodeInput } from '@codama/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@codama/visitors-core';

export type ErrorUpdates = Partial<ErrorNodeInput> | { delete: true };

export function updateErrorsVisitor(map: Record<string, ErrorUpdates>) {
    return bottomUpTransformerVisitor(
        Object.entries(map).map(
            ([name, updates]): BottomUpNodeTransformerWithSelector => ({
                select: `[errorNode]${name}`,
                transform: node => {
                    assertIsNode(node, 'errorNode');
                    if ('delete' in updates) return null;
                    return errorNode({ ...node, ...updates });
                },
            }),
        ),
    );
}
