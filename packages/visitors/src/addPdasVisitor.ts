import { CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES, CodamaError } from '@codama/errors';
import { camelCase } from '@codama/fragments/casing';
import { assertIsNode, pdaNode, PdaNodeInput, programNode } from '@codama/nodes';
import { bottomUpTransformerVisitor } from '@codama/visitors-core';

export function addPdasVisitor(pdas: Record<string, Omit<PdaNodeInput, 'programId'>[]>) {
    return bottomUpTransformerVisitor(
        Object.entries(pdas).map(([uncasedProgramName, newPdas]) => {
            const programName = camelCase(uncasedProgramName);
            return {
                select: `[programNode]${programName}`,
                transform: node => {
                    assertIsNode(node, 'programNode');
                    const existingPdaNames = new Set((node.pdas ?? []).map(pda => pda.identifier));
                    const newPdaNames = new Set(newPdas.map(pda => pda.identifier));
                    const overlappingPdaNames = new Set([...existingPdaNames].filter(name => newPdaNames.has(name)));
                    if (overlappingPdaNames.size > 0) {
                        throw new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES, {
                            duplicatedPdaNames: [...overlappingPdaNames],
                            program: node,
                            programName: node.identifier,
                        });
                    }
                    return programNode({
                        ...node,
                        pdas: [
                            ...(node.pdas ?? []),
                            ...newPdas.map(({ identifier, seeds, docs }) => pdaNode({ docs, identifier, seeds })),
                        ],
                    });
                },
            };
        }),
    );
}
