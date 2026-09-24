import { camelCase } from '@codama/fragments/casing';
import {
    accountLinkNode,
    accountNode,
    AccountNodeInput,
    assertIsNode,
    IdentifierString,
    pdaLinkNode,
    PdaNode,
    pdaNode,
    PdaSeedNode,
    programNode,
    transformNestedTypeNode,
} from '@codama/nodes';
import {
    BottomUpNodeTransformerWithSelector,
    bottomUpTransformerVisitor,
    findProgramNodeFromPath,
} from '@codama/visitors-core';

import { renameStructNode } from './renameHelpers';

export type AccountUpdates =
    | { delete: true }
    | (Partial<Omit<AccountNodeInput, 'data'>> & {
          data?: Record<string, string>;
          seeds?: PdaSeedNode[];
      });

export function updateAccountsVisitor(map: Record<string, AccountUpdates>) {
    return bottomUpTransformerVisitor(
        Object.entries(map).flatMap(([selector, updates]) => {
            const newName =
                typeof updates === 'object' && 'identifier' in updates && updates.identifier
                    ? camelCase(updates.identifier)
                    : undefined;
            const pdasToUpsert = [] as { pda: PdaNode; program: IdentifierString }[];

            const transformers: BottomUpNodeTransformerWithSelector[] = [
                {
                    select: ['[accountNode]', selector],
                    transform: (node, stack) => {
                        assertIsNode(node, 'accountNode');
                        if ('delete' in updates) return null;

                        const programNode = findProgramNodeFromPath(stack.getPath())!;
                        const { seeds, pda, ...assignableUpdates } = updates;
                        let newPda = node.pda;
                        if (pda && seeds !== undefined) {
                            newPda = pda;
                            pdasToUpsert.push({
                                pda: pdaNode({ identifier: pda.identifier, seeds }),
                                program: programNode.identifier,
                            });
                        } else if (pda) {
                            newPda = pda;
                        } else if (seeds !== undefined && node.pda) {
                            pdasToUpsert.push({
                                pda: pdaNode({ identifier: node.pda.identifier, seeds }),
                                program: programNode.identifier,
                            });
                        } else if (seeds !== undefined) {
                            newPda = pdaLinkNode(newName ?? node.identifier);
                            pdasToUpsert.push({
                                pda: pdaNode({ identifier: newName ?? node.identifier, seeds }),
                                program: programNode.identifier,
                            });
                        }

                        return accountNode({
                            ...node,
                            ...assignableUpdates,
                            data: transformNestedTypeNode(node.data, struct =>
                                renameStructNode(struct, updates.data ?? {}),
                            ),
                            pda: newPda,
                        });
                    },
                },
                {
                    select: `[programNode]`,
                    transform: node => {
                        assertIsNode(node, 'programNode');
                        const pdasToUpsertForProgram = pdasToUpsert
                            .filter(p => p.program === node.identifier)
                            .map(p => p.pda);
                        if (pdasToUpsertForProgram.length === 0) return node;
                        const existingPdaNames = new Set((node.pdas ?? []).map(pda => pda.identifier));
                        const pdasToCreate = pdasToUpsertForProgram.filter(p => !existingPdaNames.has(p.identifier));
                        const pdasToUpdate = new Map(
                            pdasToUpsertForProgram
                                .filter(p => existingPdaNames.has(p.identifier))
                                .map(p => [p.identifier, p]),
                        );
                        const newPdas = [
                            ...(node.pdas ?? []).map(p => pdasToUpdate.get(p.identifier) ?? p),
                            ...pdasToCreate,
                        ];
                        return programNode({ ...node, pdas: newPdas });
                    },
                },
            ];

            if (newName) {
                transformers.push(
                    {
                        select: ['[accountLinkNode]', selector],
                        transform: node => {
                            assertIsNode(node, 'accountLinkNode');
                            return accountLinkNode(newName);
                        },
                    },
                    {
                        select: ['[pdaNode]', selector],
                        transform: node => {
                            assertIsNode(node, 'pdaNode');
                            return pdaNode({ identifier: newName, seeds: node.seeds });
                        },
                    },
                    {
                        select: ['[pdaLinkNode]', selector],
                        transform: node => {
                            assertIsNode(node, 'pdaLinkNode');
                            return pdaLinkNode(newName);
                        },
                    },
                );
            }

            return transformers;
        }),
    );
}
