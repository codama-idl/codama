import { camelCase } from '@codama/fragments/casing';
import { assertIsNode, programLinkNode, programNode, ProgramNodeInput } from '@codama/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@codama/visitors-core';

export type ProgramUpdates =
    | Partial<Omit<ProgramNodeInput, 'accounts' | 'definedTypes' | 'errors' | 'instructions'>>
    | { delete: true };

export function updateProgramsVisitor(map: Record<string, ProgramUpdates>) {
    return bottomUpTransformerVisitor(
        Object.entries(map).flatMap(([name, updates]): BottomUpNodeTransformerWithSelector[] => {
            const newName =
                typeof updates === 'object' && 'identifier' in updates && updates.identifier
                    ? camelCase(updates.identifier)
                    : undefined;

            const transformers: BottomUpNodeTransformerWithSelector[] = [
                {
                    select: `[programNode]${name}`,
                    transform: node => {
                        assertIsNode(node, 'programNode');
                        if ('delete' in updates) return null;
                        return programNode({ ...node, ...updates });
                    },
                },
            ];

            if (newName) {
                transformers.push({
                    select: `[programLinkNode]${name}`,
                    transform: node => {
                        assertIsNode(node, 'programLinkNode');
                        return programLinkNode(newName);
                    },
                });
            }

            return transformers;
        }),
    );
}
