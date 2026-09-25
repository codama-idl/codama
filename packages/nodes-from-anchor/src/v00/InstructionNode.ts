import {
    bytesValueNode,
    DiscriminatorNode,
    fieldDiscriminatorNode,
    InstructionNode,
    instructionNode,
    integerValueNode,
    StructFieldTypeNode,
    structFieldTypeNode,
    structTypeNode,
    TypeNode,
    ValueNode,
} from '@codama/nodes';

import { getAnchorInstructionDiscriminatorV00 } from '../discriminators';
import { docsFromAnchor, fixedSizeBytesTypeNode } from '../utils';
import { IdlV00Instruction } from './idl';
import { instructionAccountNodesFromAnchorV00 } from './InstructionAccountNode';
import { structFieldTypeNodeFromAnchorV00, typeNodeFromAnchorV00 } from './typeNodes';

export function instructionNodeFromAnchorV00(
    idl: IdlV00Instruction,
    ixIndex: number,
    origin?: 'anchor' | 'shank',
): InstructionNode {
    const name = idl.name ?? '';
    let dataFields = (idl.args ?? []).map(structFieldTypeNodeFromAnchorV00);

    // Instruction discriminator.
    const discriminator = getDiscriminator(idl, ixIndex, origin);
    let discriminators: DiscriminatorNode[] | undefined;
    if (discriminator) {
        dataFields = [discriminatorField(discriminator.type, discriminator.value), ...dataFields];
        discriminators = [fieldDiscriminatorNode('discriminator')];
    }

    return instructionNode({
        accounts: instructionAccountNodesFromAnchorV00(idl.accounts ?? [], dataFields),
        data: structTypeNode(dataFields),
        discriminators,
        docs: docsFromAnchor(idl.docs),
        identifier: name,
        optionalAccountStrategy: idl.legacyOptionalAccountsStrategy ? 'omitted' : 'programId',
    });
}

function getDiscriminator(
    idl: IdlV00Instruction,
    ixIndex: number,
    origin: 'anchor' | 'shank' | undefined,
): { type: TypeNode; value: ValueNode } | undefined {
    if (idl.discriminant) {
        return {
            type: typeNodeFromAnchorV00(idl.discriminant.type),
            value: integerValueNode(String(idl.discriminant.value)),
        };
    }
    if (origin === 'anchor') {
        return { type: fixedSizeBytesTypeNode(8), value: getAnchorInstructionDiscriminatorV00(idl.name ?? '') };
    }
    if (origin === 'shank') {
        return {
            type: fixedSizeBytesTypeNode(1),
            value: bytesValueNode('base16', ixIndex.toString(16).padStart(2, '0')),
        };
    }
    return undefined;
}

function discriminatorField(type: TypeNode, value: ValueNode): StructFieldTypeNode {
    return structFieldTypeNode({
        defaultValue: value,
        defaultValueStrategy: 'omitted',
        identifier: 'discriminator',
        type,
    });
}
