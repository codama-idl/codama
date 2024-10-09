import { CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES, KinobiError } from '@codama/errors';
import { assertIsNode, camelCase, pdaNode, PdaSeedNode, programNode } from '@codama/nodes';
import { bottomUpTransformerVisitor } from '@codama/visitors-core';

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
                        throw new KinobiError(CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES, {
                            duplicatedPdaNames: [...overlappingPdaNames],
                            program: node,
                            programName: node.name,
                        });
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
