import {
    bytesTypeNode,
    camelCase,
    fieldDiscriminatorNode,
    instructionArgumentNode,
    InstructionNode,
    instructionNode,
} from '@kinobi-so/nodes';

import { getAnchorDiscriminatorV01 } from '../discriminators';
import { IdlV01Instruction } from './idl';
import { instructionAccountNodesFromAnchorV01 } from './InstructionAccountNode';
import { instructionArgumentNodeFromAnchorV01 } from './InstructionArgumentNode';

export function instructionNodeFromAnchorV01(idl: IdlV01Instruction): InstructionNode {
    const name = idl.name;
    let dataArguments = idl.args.map(instructionArgumentNodeFromAnchorV01);

    const discriminatorField = instructionArgumentNode({
        defaultValue: getAnchorDiscriminatorV01(idl.discriminator),
        defaultValueStrategy: 'omitted',
        name: 'discriminator',
        type: bytesTypeNode(),
    });
    dataArguments = [discriminatorField, ...dataArguments];
    const discriminators = [fieldDiscriminatorNode('discriminator')];

    return instructionNode({
        accounts: instructionAccountNodesFromAnchorV01(idl.accounts ?? []),
        arguments: dataArguments,
        discriminators,
        docs: idl.docs ?? [],
        name: camelCase(name),
        optionalAccountStrategy: 'programId',
    });
}
