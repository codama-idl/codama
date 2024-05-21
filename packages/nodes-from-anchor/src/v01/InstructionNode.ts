import {
    AccountNode,
    bytesTypeNode,
    camelCase,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    instructionArgumentNode,
    InstructionNode,
    instructionNode,
    NestedTypeNode,
    PdaLinkNode,
    RegisteredDiscriminatorNode,
    StandaloneValueNode,
    StructFieldTypeNode,
    StructTypeNode,
    TypeNode,
} from '@kinobi-so/nodes';

import { getAnchorDiscriminatorV01 } from '../discriminators';
import { IdlV01Instruction } from './idl';
import { instructionAccountNodesFromAnchorV01 } from './InstructionAccountNode';
import { instructionArgumentNodeFromAnchorV01 } from './InstructionArgumentNode';

export function instructionNodeFromAnchorV01(
    accountTypes: AccountNode<
        NestedTypeNode<StructTypeNode<StructFieldTypeNode<TypeNode, StandaloneValueNode | undefined>[]>>,
        PdaLinkNode | undefined,
        RegisteredDiscriminatorNode[] | undefined
    >[],
    idl: IdlV01Instruction,
): InstructionNode {
    const name = idl.name;
    let dataArguments = idl.args.map(instructionArgumentNodeFromAnchorV01);

    const discriminatorField = instructionArgumentNode({
        defaultValue: getAnchorDiscriminatorV01(idl.discriminator),
        defaultValueStrategy: 'omitted',
        name: 'discriminator',
        type: fixedSizeTypeNode(bytesTypeNode(), idl.discriminator.length),
    });
    dataArguments = [discriminatorField, ...dataArguments];
    const discriminators = [fieldDiscriminatorNode('discriminator')];

    return instructionNode({
        accounts: instructionAccountNodesFromAnchorV01(accountTypes, dataArguments, idl.accounts ?? []),
        arguments: dataArguments,
        discriminators,
        docs: idl.docs ?? [],
        name: camelCase(name),
        optionalAccountStrategy: 'programId',
    });
}
