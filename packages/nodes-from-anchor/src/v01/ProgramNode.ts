import { ProgramNode, programNode, ProgramVersion } from '@codama/nodes';

import { accountNodeFromAnchorV01 } from './AccountNode';
import { definedTypeNodeFromAnchorV01 } from './DefinedTypeNode';
import { errorNodeFromAnchorV01 } from './ErrorNode';
import { eventNodeFromAnchorV01 } from './EventNode';
import { IdlV01 } from './idl';
import { instructionNodeFromAnchorV01 } from './InstructionNode';
import { extractGenerics } from './unwrapGenerics';

export function programNodeFromAnchorV01(idl: IdlV01): ProgramNode {
    const [types, generics] = extractGenerics(idl.types ?? []);
    const accounts = idl.accounts ?? [];
    const events = idl.events ?? [];
    const instructions = idl.instructions ?? [];
    const errors = idl.errors ?? [];

    const filteredTypes = types.filter(
        type =>
            !accounts.some(account => account.name === type.name) && !events.some(event => event.name === type.name),
    );
    const definedTypes = filteredTypes.map(type => definedTypeNodeFromAnchorV01(type, generics));
    const accountNodes = accounts.map(account => accountNodeFromAnchorV01(account, types, generics));

    return programNode({
        accounts: accountNodes,
        definedTypes,
        errors: errors.map(errorNodeFromAnchorV01),
        events: events.map(event => eventNodeFromAnchorV01(event, types, generics)),
        instructions: instructions.map(instruction => instructionNodeFromAnchorV01(instruction, types, generics)),
        name: idl.metadata.name,
        origin: 'anchor',
        publicKey: idl.address,
        version: idl.metadata.version as ProgramVersion,
    });
}
