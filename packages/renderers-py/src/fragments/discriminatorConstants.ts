import {
    ConstantDiscriminatorNode,
    DiscriminatorNode,
    FieldDiscriminatorNode,
    InstructionArgumentNode,
    isNode,
    StructFieldTypeNode,
    VALUE_NODES,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { bytesToPyB } from '../getTypeManifestVisitor';
import { encodeU8, encodeU16, encodeU32, encodeU64 } from '../utils/codecs';
import { DiscriminatorFragment } from './common';

export function getDiscriminatorConstantsFragment(
    scope: Pick<GlobalFragmentScope, 'genType' | 'typeManifestVisitor'> & {
        discriminatorNodes: DiscriminatorNode[];
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
        prefix: string;
    },
): DiscriminatorFragment[] {
    const fragments = scope.discriminatorNodes
        .map(node => getDiscriminatorConstantFragment(node, scope))
        .filter(Boolean) as DiscriminatorFragment[];
    if (fragments.length > 0) {
        return fragments;
    }
    return [];

    //return mergeFragments(fragments, r => r.join('\n\n'));
    //return fragments;
}

export function getDiscriminatorConstantFragment(
    discriminatorNode: DiscriminatorNode,
    scope: Pick<GlobalFragmentScope, 'genType' | 'typeManifestVisitor'> & {
        discriminatorNodes: DiscriminatorNode[];
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
        prefix: string;
    },
): DiscriminatorFragment | null {
    switch (discriminatorNode.kind) {
        case 'constantDiscriminatorNode':
            return getConstantDiscriminatorConstantFragment(discriminatorNode, scope);
        case 'fieldDiscriminatorNode':
            return getFieldDiscriminatorConstantFragment(discriminatorNode, scope);
        default:
            return null;
    }
}
export function getPyBytesLen(obj: string) {
    return obj.split('\\x').length - 1;
}
export function getConstantDiscriminatorConstantFragment(
    discriminatorNode: ConstantDiscriminatorNode,
    scope: Pick<GlobalFragmentScope, 'genType' | 'typeManifestVisitor'> & {
        discriminatorNodes: DiscriminatorNode[];
        prefix: string;
    },
): DiscriminatorFragment | null {
    const { discriminatorNodes, typeManifestVisitor } = scope;
    if (discriminatorNodes.length > 0) {
        const value = visit(discriminatorNode.constant.value, typeManifestVisitor).value;
        return new DiscriminatorFragment(
            `discriminator_${discriminatorNode.offset}`,
            value.render,
            getPyBytesLen(value.render),
        );
    } else {
        return new DiscriminatorFragment('discriminator', `b""`, 0);
    }
}
//    discriminator: typing.ClassVar = {{discriminator_assignment.renders}}
export function getFieldDiscriminatorConstantFragment(
    discriminatorNode: FieldDiscriminatorNode,
    scope: Pick<GlobalFragmentScope, 'genType' | 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
        prefix: string;
    },
): DiscriminatorFragment | null {
    const { fields, genType, typeManifestVisitor } = scope;

    const field = fields.find(f => f.name === discriminatorNode.name);
    if (!field || !field.defaultValue || !isNode(field.defaultValue, VALUE_NODES)) {
        return null;
    }

    if (genType.origin == 'anchor') {
        const value = visit(field.defaultValue, typeManifestVisitor).value;
        return new DiscriminatorFragment('discriminator', value.render, getPyBytesLen(value.render));
    } else {
        if (field.defaultValue.kind == 'numberValueNode') {
            let renderStr = '';
            if (field.type.kind == 'numberTypeNode') {
                if (field.type.format == 'u64') {
                    const valueBs = encodeU64(field.defaultValue.number);
                    renderStr = `b"${bytesToPyB(valueBs)}"`;
                } else if (field.type.format == 'u32') {
                    const valueBs = encodeU32(field.defaultValue.number);
                    renderStr = `b"${bytesToPyB(valueBs)}"`;
                } else if (field.type.format == 'u16') {
                    const valueBs = encodeU16(field.defaultValue.number);
                    renderStr = `b"${bytesToPyB(valueBs)}"`;
                } else if (field.type.format == 'u8') {
                    const valueBs = encodeU8(field.defaultValue.number);
                    renderStr = `b"${bytesToPyB(valueBs)}"`;
                }
                return new DiscriminatorFragment(field.name, renderStr, getPyBytesLen(renderStr));
            }
            return new DiscriminatorFragment(field.name, `b""`, 0);
        }
        return new DiscriminatorFragment(field.name, `b""`, 0);
    }
}
