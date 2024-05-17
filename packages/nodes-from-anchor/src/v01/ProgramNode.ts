import { ProgramNode, programNode, ProgramVersion } from '@kinobi-so/nodes';

import { accountNodeFromAnchorV01WithTypeDefinition } from './AccountNode';
import { definedTypeNodeFromAnchorV01 } from './DefinedTypeNode';
import { errorNodeFromAnchorV01 } from './ErrorNode';
import { IdlV01, IdlV01InstructionAccount } from './idl';
import { instructionNodeFromAnchorV01 } from './InstructionNode';
import { pdaNodeFromAnchorV01 } from './PdaNode';

export function programNodeFromAnchorV01(idl: IdlV01): ProgramNode {
    const types = idl.types ?? [];
    const accounts = idl.accounts ?? [];
    const instructions = idl.instructions ?? [];
    const errors = idl.errors ?? [];

    const filteredTypes = types.filter(type => !accounts.some(account => account.name === type.name));
    const definedTypes = filteredTypes.map(definedTypeNodeFromAnchorV01);
    const accountNodeFromAnchorV01 = accountNodeFromAnchorV01WithTypeDefinition(types);
    const pdas = instructions
        .flatMap<IdlV01InstructionAccount>(instruction => instruction.accounts)
        .filter(account => !!account.pda && !account.pda?.program)
        .map(pdaNodeFromAnchorV01);
    return programNode({
        accounts: accounts.map(accountNodeFromAnchorV01),
        definedTypes,
        errors: errors.map(errorNodeFromAnchorV01),
        instructions: instructions.map(instructionNodeFromAnchorV01),
        name: idl.metadata.name,
        origin: 'anchor',
        pdas,
        publicKey: idl.address,
        version: idl.metadata.version as ProgramVersion,
    });
}
