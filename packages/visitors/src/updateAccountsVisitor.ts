import {
    accountLinkNode,
    accountNode,
    AccountNodeInput,
    assertIsNode,
    camelCase,
    CamelCaseString,
    pdaLinkNode,
    PdaNode,
    pdaNode,
    PdaSeedNode,
    programNode,
    transformNestedTypeNode,
} from '@kinobi-so/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@kinobi-so/visitors-core';

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
                typeof updates === 'object' && 'name' in updates && updates.name ? camelCase(updates.name) : undefined;
            const pdasToUpsert = [] as { pda: PdaNode; program: CamelCaseString }[];

            const transformers: BottomUpNodeTransformerWithSelector[] = [
                {
                    select: ['[accountNode]', selector],
                    transform: (node, stack) => {
                        assertIsNode(node, 'accountNode');
                        if ('delete' in updates) return null;

                        const { seeds, pda, ...assignableUpdates } = updates;
                        let newPda = node.pda;
                        if (pda && !pda.importFrom && seeds !== undefined) {
                            newPda = pda;
                            pdasToUpsert.push({
                                pda: pdaNode({ name: pda.name, seeds }),
                                program: stack.getProgram()!.name,
                            });
                        } else if (pda) {
                            newPda = pda;
                        } else if (seeds !== undefined && node.pda) {
                            pdasToUpsert.push({
                                pda: pdaNode({ name: node.pda.name, seeds }),
                                program: stack.getProgram()!.name,
                            });
                        } else if (seeds !== undefined) {
                            newPda = pdaLinkNode(newName ?? node.name);
                            pdasToUpsert.push({
                                pda: pdaNode({ name: newName ?? node.name, seeds }),
                                program: stack.getProgram()!.name,
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
                            .filter(p => p.program === node.name)
                            .map(p => p.pda);
                        if (pdasToUpsertForProgram.length === 0) return node;
                        const existingPdaNames = new Set(node.pdas.map(pda => pda.name));
                        const pdasToCreate = pdasToUpsertForProgram.filter(p => !existingPdaNames.has(p.name));
                        const pdasToUpdate = new Map(
                            pdasToUpsertForProgram.filter(p => existingPdaNames.has(p.name)).map(p => [p.name, p]),
                        );
                        const newPdas = [...node.pdas.map(p => pdasToUpdate.get(p.name) ?? p), ...pdasToCreate];
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
                            if (node.importFrom) return node;
                            return accountLinkNode(newName);
                        },
                    },
                    {
                        select: ['[pdaNode]', selector],
                        transform: node => {
                            assertIsNode(node, 'pdaNode');
                            return pdaNode({ name: newName, seeds: node.seeds });
                        },
                    },
                    {
                        select: ['[pdaLinkNode]', selector],
                        transform: node => {
                            assertIsNode(node, 'pdaLinkNode');
                            if (node.importFrom) return node;
                            return pdaLinkNode(newName);
                        },
                    },
                );
            }

            return transformers;
        }),
    );
}
