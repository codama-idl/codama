import { assertIsNode, camelCase, programLinkNode, programNode, ProgramNodeInput } from '@kinobi-so/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@kinobi-so/visitors-core';

export type ProgramUpdates =
    | Partial<Omit<ProgramNodeInput, 'accounts' | 'definedTypes' | 'errors' | 'instructions'>>
    | { delete: true };

export function updateProgramsVisitor(map: Record<string, ProgramUpdates>) {
    return bottomUpTransformerVisitor(
        Object.entries(map).flatMap(([name, updates]): BottomUpNodeTransformerWithSelector[] => {
            const newName =
                typeof updates === 'object' && 'name' in updates && updates.name ? camelCase(updates.name) : undefined;

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
