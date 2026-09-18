import {
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    EnumTypeNode,
    enumTypeNode,
    EnumVariantTypeNode,
    isNode,
    structFieldTypeNode,
    StructTypeNode,
    structTypeNode,
} from '@codama/nodes';

export function renameStructNode(node: StructTypeNode, map: Record<string, string>): StructTypeNode {
    return structTypeNode(
        (node.fields ?? []).map(field =>
            map[field.identifier] ? structFieldTypeNode({ ...field, identifier: map[field.identifier] }) : field,
        ),
    );
}

export function renameEnumNode(node: EnumTypeNode, map: Record<string, string>): EnumTypeNode {
    return enumTypeNode(
        (node.variants ?? []).map(variant =>
            map[variant.identifier] ? renameEnumVariant(variant, map[variant.identifier]) : variant,
        ),
        { ...node },
    );
}

function renameEnumVariant(variant: EnumVariantTypeNode, newName: string) {
    if (isNode(variant, 'enumStructVariantTypeNode')) {
        return enumStructVariantTypeNode(newName, variant.struct);
    }
    if (isNode(variant, 'enumTupleVariantTypeNode')) {
        return enumTupleVariantTypeNode(newName, variant.tuple);
    }
    return enumEmptyVariantTypeNode(newName);
}
