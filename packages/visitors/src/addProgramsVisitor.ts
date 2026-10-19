import { CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PROGRAM_NAMES, CodamaError } from '@codama/errors';
import { camelCase } from '@codama/fragments/casing';
import { IdentifierString, programNode, ProgramNodeInput, rootNode } from '@codama/nodes';
import { rootNodeVisitor } from '@codama/visitors-core';

/**
 * Append programs to the root's additional programs.
 *
 * @throws {CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PROGRAM_NAMES} if a
 * new program shares a camelCase identifier with the main program, an
 * existing additional program, or another new program.
 */
export function addProgramsVisitor(programs: ProgramNodeInput[]) {
    return rootNodeVisitor(root => {
        const newPrograms = programs.map(program => programNode(program));
        const usedNames = new Set(
            [root.program, ...(root.additionalPrograms ?? [])].map(program => camelCase(program.identifier)),
        );
        const duplicatedProgramNames = new Set<IdentifierString>();
        newPrograms.forEach(program => {
            const key = camelCase(program.identifier);
            if (usedNames.has(key)) duplicatedProgramNames.add(program.identifier);
            usedNames.add(key);
        });
        if (duplicatedProgramNames.size > 0) {
            throw new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PROGRAM_NAMES, {
                duplicatedProgramNames: [...duplicatedProgramNames],
                path: [root],
            });
        }
        return rootNode(root.program, {
            additionalPrograms: [...(root.additionalPrograms ?? []), ...newPrograms],
            plugins: root.plugins,
        });
    });
}
