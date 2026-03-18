import { ProgramNode, programNode, ProgramVersion } from '@codama/nodes';

import { accountNodeFromAnchorV01 } from './AccountNode';
import { definedTypeNodeFromAnchorV01 } from './DefinedTypeNode';
import { errorNodeFromAnchorV01 } from './ErrorNode';
import { extractPdasFromProgram } from './extractPdas';
import { IdlV01 } from './idl';
import { instructionNodeFromAnchorV01 } from './InstructionNode';
import { extractGenerics } from './unwrapGenerics';

export type ProgramNodeFromAnchorV01Options = {
    extractPdas?: boolean;
};

export function programNodeFromAnchorV01(idl: IdlV01, options: ProgramNodeFromAnchorV01Options = {}): ProgramNode {
    const { extractPdas = true } = options;
    const [types, generics] = extractGenerics(idl.types ?? []);
    const accounts = idl.accounts ?? [];
    const instructions = idl.instructions ?? [];
    const errors = idl.errors ?? [];

    const filteredTypes = types.filter(type => !accounts.some(account => account.name === type.name));
    const definedTypes = filteredTypes.map(type => definedTypeNodeFromAnchorV01(type, generics));
    const accountNodes = accounts.map(account => accountNodeFromAnchorV01(account, types, generics));

    const program = programNode({
        accounts: accountNodes,
        definedTypes,
        errors: errors.map(errorNodeFromAnchorV01),
        instructions: instructions.map(instruction => instructionNodeFromAnchorV01(instruction, generics)),
        name: idl.metadata.name,
        origin: 'anchor',
        publicKey: idl.address,
        version: idl.metadata.version as ProgramVersion,
    });

    return extractPdas ? extractPdasFromProgram(program) : program;
}
