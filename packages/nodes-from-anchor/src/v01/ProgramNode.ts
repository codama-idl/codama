import { ProgramNode, programNode, ProgramVersion } from '@kinobi-so/nodes';

import { accountNodeFromAnchorV01WithTypeDefinition } from './AccountNode';
import { definedTypeNodeFromAnchorV01 } from './DefinedTypeNode';
import { errorNodeFromAnchorV01 } from './ErrorNode';
import { IdlV01 } from './idl';
import { instructionNodeFromAnchorV01 } from './InstructionNode';

export function programNodeFromAnchorV01(idl: IdlV01): ProgramNode {
    const types = idl.types ?? [];
    const accounts = idl.accounts ?? [];
    const instructions = idl.instructions ?? [];
    const errors = idl.errors ?? [];

    const filteredTypes = types.filter(type => !accounts.some(account => account.name === type.name));
    const definedTypes = filteredTypes.map(definedTypeNodeFromAnchorV01);
    const accountNodeFromAnchorV01 = accountNodeFromAnchorV01WithTypeDefinition(types);
    const accountNodes = accounts.map(accountNodeFromAnchorV01);

    return programNode({
        accounts: accountNodes,
        definedTypes,
        errors: errors.map(errorNodeFromAnchorV01),
        instructions: instructions.map(instruction => instructionNodeFromAnchorV01(accountNodes, instruction)),
        name: idl.metadata.name,
        origin: 'anchor',
        publicKey: idl.address,
        version: idl.metadata.version as ProgramVersion,
    });
}
