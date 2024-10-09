import {
    assertIsNode,
    camelCase,
    definedTypeLinkNode,
    definedTypeNode,
    DefinedTypeNodeInput,
    isNode,
} from '@codama/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@codama/visitors-core';

import { renameEnumNode, renameStructNode } from './renameHelpers';

export type DefinedTypeUpdates =
    | { delete: true }
    | (Partial<Omit<DefinedTypeNodeInput, 'data'>> & {
          data?: Record<string, string>;
      });

export function updateDefinedTypesVisitor(map: Record<string, DefinedTypeUpdates>) {
    return bottomUpTransformerVisitor(
        Object.entries(map).flatMap(([selector, updates]): BottomUpNodeTransformerWithSelector[] => {
            const newName =
                typeof updates === 'object' && 'name' in updates && updates.name ? camelCase(updates.name) : undefined;

            const transformers: BottomUpNodeTransformerWithSelector[] = [
                {
                    select: ['[definedTypeNode]', selector],
                    transform: node => {
                        assertIsNode(node, 'definedTypeNode');
                        if ('delete' in updates) {
                            return null;
                        }
                        const { data: dataUpdates, ...otherUpdates } = updates;
                        let newType = node.type;
                        if (isNode(node.type, 'structTypeNode')) {
                            newType = renameStructNode(node.type, dataUpdates ?? {});
                        } else if (isNode(node.type, 'enumTypeNode')) {
                            newType = renameEnumNode(node.type, dataUpdates ?? {});
                        }
                        return definedTypeNode({
                            ...node,
                            ...otherUpdates,
                            name: newName ?? node.name,
                            type: newType,
                        });
                    },
                },
            ];

            if (newName) {
                transformers.push({
                    select: ['[definedTypeLinkNode]', selector],
                    transform: node => {
                        assertIsNode(node, 'definedTypeLinkNode');
                        return definedTypeLinkNode(newName);
                    },
                });
            }

            return transformers;
        }),
    );
}
