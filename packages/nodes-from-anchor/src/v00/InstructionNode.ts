import {
    bytesTypeNode,
    camelCase,
    DiscriminatorNode,
    fieldDiscriminatorNode,
    instructionArgumentNode,
    InstructionNode,
    instructionNode,
    numberValueNode,
} from '@kinobi-so/nodes';

import { getAnchorInstructionDiscriminator } from '../discriminators';
import { IdlV00Instruction } from './idl';
import { instructionAccountNodesFromAnchorV00 } from './InstructionAccountNode';
import { instructionArgumentNodeFromAnchorV00 } from './InstructionArgumentNode';
import { typeNodeFromAnchorV00 } from './typeNodes';

export function instructionNodeFromAnchorV00(idl: IdlV00Instruction, origin?: 'anchor' | 'shank'): InstructionNode {
    const idlName = idl.name ?? '';
    const name = camelCase(idlName);
    let dataArguments = (idl.args ?? []).map(instructionArgumentNodeFromAnchorV00);

    // Instruction discriminator.
    let discriminators: DiscriminatorNode[] | undefined;
    if (idl.discriminant) {
        const discriminatorField = instructionArgumentNode({
            defaultValue: numberValueNode(idl.discriminant.value),
            defaultValueStrategy: 'omitted',
            name: 'discriminator',
            type: typeNodeFromAnchorV00(idl.discriminant.type),
        });
        dataArguments = [discriminatorField, ...dataArguments];
        discriminators = [fieldDiscriminatorNode('discriminator')];
    } else if (origin === 'anchor') {
        const discriminatorField = instructionArgumentNode({
            defaultValue: getAnchorInstructionDiscriminator(idlName),
            defaultValueStrategy: 'omitted',
            name: 'discriminator',
            type: bytesTypeNode(),
        });
        dataArguments = [discriminatorField, ...dataArguments];
        discriminators = [fieldDiscriminatorNode('discriminator')];
    }

    return instructionNode({
        accounts: instructionAccountNodesFromAnchorV00(idl.accounts ?? []),
        arguments: dataArguments,
        discriminators,
        docs: idl.docs ?? [],
        name,
        optionalAccountStrategy: idl.legacyOptionalAccountsStrategy ? 'omitted' : 'programId',
    });
}
