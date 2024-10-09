import { ProgramNode, programNode, ProgramVersion } from '@codama/nodes';

import { accountNodeFromAnchorV00 } from './AccountNode';
import { definedTypeNodeFromAnchorV00 } from './DefinedTypeNode';
import { errorNodeFromAnchorV00 } from './ErrorNode';
import { IdlV00 } from './idl';
import { instructionNodeFromAnchorV00 } from './InstructionNode';
import { pdaNodeFromAnchorV00 } from './PdaNode';

export function programNodeFromAnchorV00(idl: IdlV00): ProgramNode {
    const origin: 'anchor' | 'shank' = idl.metadata?.origin ?? 'anchor';
    const pdas = (idl.accounts ?? []).filter(account => (account.seeds ?? []).length > 0).map(pdaNodeFromAnchorV00);
    const accounts = (idl.accounts ?? []).map(a => accountNodeFromAnchorV00(a, origin));
    const instructions = (idl.instructions ?? []).map(i => instructionNodeFromAnchorV00(i, origin));
    return programNode({
        accounts,
        definedTypes: (idl.types ?? []).map(definedTypeNodeFromAnchorV00),
        errors: (idl.errors ?? []).map(errorNodeFromAnchorV00),
        instructions,
        name: idl.name ?? '',
        origin,
        pdas,
        publicKey: idl.metadata?.address ?? '',
        version: idl.version as ProgramVersion,
    });
}
