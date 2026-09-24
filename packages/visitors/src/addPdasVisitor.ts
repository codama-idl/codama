import { CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES, CodamaError } from '@codama/errors';
import { camelCase } from '@codama/fragments/casing';
import { assertIsNode, IdentifierString, pdaNode, PdaNodeInput, programNode } from '@codama/nodes';
import { bottomUpTransformerVisitor } from '@codama/visitors-core';

/**
 * Add PDAs to programs, keyed by program identifier (matched exactly).
 *
 * @throws {CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES} if a new
 * PDA shares a camelCase form with an existing or another new PDA of the
 * same program, as they would then collide under the spec's
 * casing-collision rule.
 */
export function addPdasVisitor(pdas: Record<string, PdaNodeInput[]>) {
    return bottomUpTransformerVisitor(
        Object.entries(pdas).map(([programName, newPdas]) => ({
            select: ['[programNode]', programName],
            transform: node => {
                assertIsNode(node, 'programNode');
                const newPdaNodes = newPdas.map(pda => pdaNode(pda));
                const usedNames = new Set((node.pdas ?? []).map(pda => camelCase(pda.identifier)));
                const duplicatedPdaNames = new Set<IdentifierString>();
                newPdaNodes.forEach(pda => {
                    const key = camelCase(pda.identifier);
                    if (usedNames.has(key)) duplicatedPdaNames.add(pda.identifier);
                    usedNames.add(key);
                });
                if (duplicatedPdaNames.size > 0) {
                    throw new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES, {
                        duplicatedPdaNames: [...duplicatedPdaNames],
                        program: node,
                        programName: node.identifier,
                    });
                }
                return programNode({ ...node, pdas: [...(node.pdas ?? []), ...newPdaNodes] });
            },
        })),
    );
}
