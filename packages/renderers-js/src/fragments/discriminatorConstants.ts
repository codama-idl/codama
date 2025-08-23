import {
    camelCase,
    ConstantDiscriminatorNode,
    DiscriminatorNode,
    FieldDiscriminatorNode,
    InstructionArgumentNode,
    isNode,
    isNodeFilter,
    StructFieldTypeNode,
    VALUE_NODES,
} from '@codama/nodes';
import { mapFragmentContent } from '@codama/renderers-core';
import { visit } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, mergeFragments } from '../utils';

export function getDiscriminatorConstantsFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi' | 'typeManifestVisitor'> & {
        discriminatorNodes: DiscriminatorNode[];
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
        prefix: string;
    },
): Fragment {
    const fragments = scope.discriminatorNodes
        .map(node => getDiscriminatorConstantFragment(node, scope))
        .filter(Boolean) as Fragment[];

    return mergeFragments(fragments, c => c.join('\n\n'));
}

export function getDiscriminatorConstantFragment(
    discriminatorNode: DiscriminatorNode,
    scope: Pick<GlobalFragmentScope, 'nameApi' | 'typeManifestVisitor'> & {
        discriminatorNodes: DiscriminatorNode[];
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
        prefix: string;
    },
): Fragment | null {
    switch (discriminatorNode.kind) {
        case 'constantDiscriminatorNode':
            return getConstantDiscriminatorConstantFragment(discriminatorNode, scope);
        case 'fieldDiscriminatorNode':
            return getFieldDiscriminatorConstantFragment(discriminatorNode, scope);
        default:
            return null;
    }
}

export function getConstantDiscriminatorConstantFragment(
    discriminatorNode: ConstantDiscriminatorNode,
    scope: Pick<GlobalFragmentScope, 'nameApi' | 'typeManifestVisitor'> & {
        discriminatorNodes: DiscriminatorNode[];
        prefix: string;
    },
): Fragment | null {
    const { discriminatorNodes, typeManifestVisitor, prefix } = scope;

    const index = discriminatorNodes.filter(isNodeFilter('constantDiscriminatorNode')).indexOf(discriminatorNode);
    const suffix = index <= 0 ? '' : `_${index + 1}`;

    const name = camelCase(`${prefix}_discriminator${suffix}`);
    const strictType = visit(discriminatorNode.constant.type, typeManifestVisitor).strictType;
    const encoder = visit(discriminatorNode.constant.type, typeManifestVisitor).encoder;
    const value = visit(discriminatorNode.constant.value, typeManifestVisitor).value;
    return getConstantFragment({ ...scope, encoder, name, strictType, value });
}

export function getFieldDiscriminatorConstantFragment(
    discriminatorNode: FieldDiscriminatorNode,
    scope: Pick<GlobalFragmentScope, 'nameApi' | 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
        prefix: string;
    },
): Fragment | null {
    const { fields, prefix, typeManifestVisitor } = scope;

    const field = fields.find(f => f.name === discriminatorNode.name);
    if (!field || !field.defaultValue || !isNode(field.defaultValue, VALUE_NODES)) {
        return null;
    }

    const name = camelCase(`${prefix}_${discriminatorNode.name}`);
    const encoder = visit(field.type, typeManifestVisitor).encoder;
    const strictType = visit(field.type, typeManifestVisitor).strictType;
    const value = visit(field.defaultValue, typeManifestVisitor).value;
    return getConstantFragment({ ...scope, encoder, name, strictType, value });
}

function getConstantFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        encoder: Fragment;
        name: string;
        strictType: Fragment;
        value: Fragment;
    },
): Fragment {
    const { encoder, name, nameApi, value, strictType } = scope;
    const constantName = nameApi.constant(name);
    const constantFunction = nameApi.constantFunction(name);

    return mergeFragments(
        [
            mapFragmentContent(value, c => `export const ${constantName}: ${strictType.content} = ${c};`),
            mapFragmentContent(
                encoder,
                c =>
                    `export function ${constantFunction}(): ReadonlyUint8Array { return ${c}.encode(${constantName}); }`,
            ),
        ],
        c => c.join('\n\n'),
    );
}
