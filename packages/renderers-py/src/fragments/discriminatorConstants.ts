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
import { DiscriminatorFragment } from './common';

export function getDiscriminatorConstantsFragment(
    scope: Pick<GlobalFragmentScope, 'genType' | 'typeManifestVisitor'> & {
        discriminatorNodes: DiscriminatorNode[];
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
        prefix: string;
    },
): DiscriminatorFragment {
    const fragments = scope.discriminatorNodes
        .map(node => getDiscriminatorConstantFragment(node, scope))
        .filter(Boolean) as DiscriminatorFragment[];
    if (fragments.length > 0) {
        return fragments[0];
    }
    return new DiscriminatorFragment([`b""`], 0);

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
    //const name = camelCase(`${prefix}_discriminator${suffix}`);
    if (discriminatorNodes.length > 0) {
        const value = visit(discriminatorNode.constant.value, typeManifestVisitor).value;
        return new DiscriminatorFragment([value.render], getPyBytesLen(value.render));
    } else {
        return new DiscriminatorFragment([`b""`], 0);
    }
}

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

    //const name = camelCase(`${prefix}_${discriminatorNode.name}`);
    if (genType.origin == 'anchor') {
        const value = visit(field.defaultValue, typeManifestVisitor).value;
        //console.log(value.render);
        //console.log("getFieldDiscriminatorConstantFragment:",field,value)
        //return getConstantFragment({ ...scope, name, value });
        return new DiscriminatorFragment([value.render], getPyBytesLen(value.render));
    } else {
        if (field.defaultValue.kind == 'numberValueNode') {
            const renderStr = `b"\\x${field.defaultValue.number.toString(16)}"`;
            return new DiscriminatorFragment([renderStr], getPyBytesLen(renderStr));
        }
        return new DiscriminatorFragment([''], 0);
        //const value = visit(field.defaultValue, typeManifestVisitor).value;
        //console.log(value.render);
        //console.log("getFieldDiscriminatorConstantFragment:",field,value)
        //return getConstantFragment({ ...scope, name, value });
    }
}
/*
function getConstantFragment(
    scope: GlobalFragmentScope & {
        name: string;
        value: Fragment;
    },
): DiscriminatorFragment {
    const { value } = scope;
    const valueStr: string = `${value.render}`;

    return new DiscriminatorFragment(valueStr,);
}*/
