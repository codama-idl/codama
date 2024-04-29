import { ProgramNode, programNode, ProgramVersion } from '@kinobi-so/nodes';

import { accountNodeFromAnchorV01 } from './AccountNode';
import { definedTypeNodeFromAnchorV01 } from './DefinedTypeNode';
import { errorNodeFromAnchorV01 } from './ErrorNode';
import { IdlV01 } from './idl';
import { instructionNodeFromAnchorV01 } from './InstructionNode';

export function programNodeFromAnchorV01(idl: IdlV01): ProgramNode {
    const types = idl.types ?? [];
    const accounts = idl.accounts ?? [];
    const instructions = idl.instructions ?? [];
    const errors = idl.errors ?? [];

    return programNode({
        accounts: accounts.map(accountNodeFromAnchorV01),
        definedTypes: types.map(definedTypeNodeFromAnchorV01),
        errors: errors.map(errorNodeFromAnchorV01),
        instructions: instructions.map(instructionNodeFromAnchorV01),
        name: idl.metadata.name,
        origin: 'anchor',
        pdas: [],
        publicKey: idl.address,
        version: idl.metadata.version as ProgramVersion,
    });
}
