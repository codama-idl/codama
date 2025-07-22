import {
    camelCase,
    ConstantDiscriminatorNode,
    DiscriminatorNode,
    FieldDiscriminatorNode,
    InstructionArgumentNode,
    isNode,
    isNodeFilter,
    snakeCase,
    StructFieldTypeNode,
    VALUE_NODES,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';

import { getTypeManifestVisitor, TypeManifest } from '../getTypeManifestVisitor';
import { ImportMap } from '../ImportMap';
import { renderValueNode } from '../renderValueNodeVisitor';
import { GetImportFromFunction } from './linkOverrides';

type Fragment = { imports: ImportMap; render: string };

function mergeFragments(fragments: Fragment[], merge: (parts: string[]) => string): Fragment {
    const imports = fragments.reduce((acc, frag) => acc.mergeWith(frag.imports), new ImportMap());
    const render = merge(fragments.map(frag => frag.render));
    return { imports, render };
}

export function getDiscriminatorConstants(scope: {
    discriminatorNodes: DiscriminatorNode[];
    fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    getImportFrom: GetImportFromFunction;
    prefix: string;
    typeManifestVisitor: ReturnType<typeof getTypeManifestVisitor>;
}): Fragment {
    const fragments = scope.discriminatorNodes
        .map(node => getDiscriminatorConstant(node, scope))
        .filter(Boolean) as Fragment[];

    return mergeFragments(fragments, r => r.join('\n\n'));
}

function getDiscriminatorConstant(
    discriminatorNode: DiscriminatorNode,
    scope: {
        discriminatorNodes: DiscriminatorNode[];
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
        getImportFrom: GetImportFromFunction;
        prefix: string;
        typeManifestVisitor: ReturnType<typeof getTypeManifestVisitor>;
    },
) {
    switch (discriminatorNode.kind) {
        case 'constantDiscriminatorNode':
            return getConstantDiscriminatorConstant(discriminatorNode, scope);
        case 'fieldDiscriminatorNode':
            return getFieldDiscriminatorConstant(discriminatorNode, scope);
        default:
            return null;
    }
}

function getConstantDiscriminatorConstant(
    discriminatorNode: ConstantDiscriminatorNode,
    scope: {
        discriminatorNodes: DiscriminatorNode[];
        getImportFrom: GetImportFromFunction;
        prefix: string;
        typeManifestVisitor: ReturnType<typeof getTypeManifestVisitor>;
    },
): Fragment {
    const { discriminatorNodes, getImportFrom, prefix, typeManifestVisitor } = scope;

    const index = discriminatorNodes.filter(isNodeFilter('constantDiscriminatorNode')).indexOf(discriminatorNode);
    const suffix = index <= 0 ? '' : `_${index + 1}`;

    const name = camelCase(`${prefix}_discriminator${suffix}`);
    const typeManifest = visit(discriminatorNode.constant.type, typeManifestVisitor);
    const value = renderValueNode(discriminatorNode.constant.value, getImportFrom);
    return getConstant(name, typeManifest, value);
}

function getFieldDiscriminatorConstant(
    discriminatorNode: FieldDiscriminatorNode,
    scope: {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
        getImportFrom: GetImportFromFunction;
        prefix: string;
        typeManifestVisitor: ReturnType<typeof getTypeManifestVisitor>;
    },
): Fragment | null {
    const { fields, prefix, getImportFrom, typeManifestVisitor } = scope;

    const field = fields.find(f => f.name === discriminatorNode.name);
    if (!field || !field.defaultValue || !isNode(field.defaultValue, VALUE_NODES)) {
        return null;
    }

    const name = camelCase(`${prefix}_${discriminatorNode.name}`);
    const typeManifest = visit(field.type, typeManifestVisitor);
    const value = renderValueNode(field.defaultValue, getImportFrom);
    return getConstant(name, typeManifest, value);
}

function getConstant(name: string, typeManifest: TypeManifest, value: Fragment): Fragment {
    const type: Fragment = { imports: typeManifest.imports, render: typeManifest.type };
    return mergeFragments([type, value], ([t, v]) => `pub const ${snakeCase(name).toUpperCase()}: ${t} = ${v};`);
}
