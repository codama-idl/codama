import { CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, CodamaError } from '@codama/errors';
import { type Address, address } from '@solana/addresses';
import { findProgramNodeFromPath, getLastNodeFromPath, type InstructionNode, type NodePath } from 'codama';

/** The address of the program defining the instruction at the end of the given path. */
export function getInstructionProgramAddress(path: NodePath<InstructionNode>): Address {
    const program = findProgramNodeFromPath(path);
    if (!program) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
            message: `The path of instruction [${getLastNodeFromPath(path).identifier}] must include its program.`,
        });
    }
    return address(program.publicKey);
}
