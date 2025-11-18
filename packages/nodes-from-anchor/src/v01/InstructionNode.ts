import {
    AccountNode,
    bytesTypeNode,
    camelCase,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    instructionArgumentNode,
    InstructionNode,
    instructionNode,
} from '@codama/nodes';

import { getAnchorDiscriminatorV01 } from '../discriminators';
import type { IdlV01Instruction } from './idl';
import { instructionAccountNodesFromAnchorV01 } from './InstructionAccountNode';
import { instructionArgumentNodeFromAnchorV01 } from './InstructionArgumentNode';
import type { GenericsV01 } from './unwrapGenerics';

export function instructionNodeFromAnchorV01(
    allAccounts: AccountNode[],
    idl: IdlV01Instruction,
    generics: GenericsV01,
): InstructionNode {
    const name = idl.name;
    let dataArguments = idl.args.map(arg => instructionArgumentNodeFromAnchorV01(arg, generics));

    const discriminatorField = instructionArgumentNode({
        defaultValue: getAnchorDiscriminatorV01(idl.discriminator),
        defaultValueStrategy: 'omitted',
        name: 'discriminator',
        type: fixedSizeTypeNode(bytesTypeNode(), idl.discriminator.length),
    });
    dataArguments = [discriminatorField, ...dataArguments];
    const discriminators = [fieldDiscriminatorNode('discriminator')];

    return instructionNode({
        accounts: instructionAccountNodesFromAnchorV01(allAccounts, dataArguments, idl.accounts ?? []),
        arguments: dataArguments,
        discriminators,
        docs: idl.docs ?? [],
        name: camelCase(name),
        optionalAccountStrategy: 'programId',
    });
}
