import { assertIsNode, camelCase, pdaNode, PdaSeedNode, programNode } from '@kinobi-so/nodes';
import { bottomUpTransformerVisitor } from '@kinobi-so/visitors-core';

export function addPdasVisitor(pdas: Record<string, { name: string; seeds: PdaSeedNode[] }[]>) {
    return bottomUpTransformerVisitor(
        Object.entries(pdas).map(([uncasedProgramName, newPdas]) => {
            const programName = camelCase(uncasedProgramName);
            return {
                select: `[programNode]${programName}`,
                transform: node => {
                    assertIsNode(node, 'programNode');
                    const existingPdaNames = new Set(node.pdas.map(pda => pda.name));
                    const newPdaNames = new Set(newPdas.map(pda => pda.name));
                    const overlappingPdaNames = new Set([...existingPdaNames].filter(name => newPdaNames.has(name)));
                    if (overlappingPdaNames.size > 0) {
                        // TODO: Coded error.
                        throw new Error(
                            `Cannot add PDAs to program "${programName}" because the following PDA names ` +
                                `already exist: ${[...overlappingPdaNames].join(', ')}.`,
                        );
                    }
                    return programNode({
                        ...node,
                        pdas: [...node.pdas, ...newPdas.map(pda => pdaNode({ name: pda.name, seeds: pda.seeds }))],
                    });
                },
            };
        }),
    );
}
