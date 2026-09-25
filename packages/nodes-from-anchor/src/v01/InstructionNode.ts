import {
    fieldDiscriminatorNode,
    InstructionNode,
    instructionNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';

import { getAnchorDiscriminatorV01 } from '../discriminators';
import { docsFromAnchor, fixedSizeBytesTypeNode } from '../utils';
import type { IdlV01Instruction } from './idl';
import { instructionAccountNodesFromAnchorV01 } from './InstructionAccountNode';
import { structFieldTypeNodeFromAnchorV01 } from './typeNodes';
import type { GenericsV01 } from './unwrapGenerics';

export function instructionNodeFromAnchorV01(idl: IdlV01Instruction, generics: GenericsV01): InstructionNode {
    const discriminatorField = structFieldTypeNode({
        defaultValue: getAnchorDiscriminatorV01(idl.discriminator),
        defaultValueStrategy: 'omitted',
        identifier: 'discriminator',
        type: fixedSizeBytesTypeNode(idl.discriminator.length),
    });
    const dataFields = [discriminatorField, ...idl.args.map(arg => structFieldTypeNodeFromAnchorV01(arg, generics))];

    return instructionNode({
        accounts: instructionAccountNodesFromAnchorV01(idl.accounts ?? [], dataFields),
        data: structTypeNode(dataFields),
        discriminators: [fieldDiscriminatorNode('discriminator')],
        docs: docsFromAnchor(idl.docs),
        identifier: idl.name,
        optionalAccountStrategy: 'programId',
    });
}
