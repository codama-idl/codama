import { KINOBI_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_ADDITIONAL_PROGRAMS, KinobiError } from '@kinobi-so/errors';
import {
    assertIsNode,
    getAllPrograms,
    type ProgramNode,
    type RootNode,
    rootNode
} from '@kinobi-so/nodes';
import { rootNodeVisitor } from '@kinobi-so/visitors-core';

export function addProgramsVisitor(node: ProgramNode | ProgramNode[] | RootNode) {
    const newPrograms = getAllPrograms(node);
    return rootNodeVisitor((node) => {
        assertIsNode(node, 'rootNode');
        const existingPublicKeys = new Set([node.program.publicKey, ...node.additionalPrograms.map(program => program.publicKey)]);
        const newProgramPublicKeys = new Set(newPrograms.map(program => program.publicKey));
        const overlappingProgramPublicKeys = new Set([...existingPublicKeys].filter(publicKey => newProgramPublicKeys.has(publicKey)));
        if (overlappingProgramPublicKeys.size > 0) {
            throw new KinobiError(KINOBI_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_ADDITIONAL_PROGRAMS, {
                duplicatedProgramPublicKeys: [...overlappingProgramPublicKeys],
                program: node.program,
                programName: node.program.name,
            });
        }
        return rootNode(node.program, [
            ...node.additionalPrograms,
            ...newPrograms,
        ]);
    });
}
