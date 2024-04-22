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
} from '@kinobi-so/nodes';

export function renameStructNode(node: StructTypeNode, map: Record<string, string>): StructTypeNode {
    return structTypeNode(
        node.fields.map(field => (map[field.name] ? structFieldTypeNode({ ...field, name: map[field.name] }) : field)),
    );
}

export function renameEnumNode(node: EnumTypeNode, map: Record<string, string>): EnumTypeNode {
    return enumTypeNode(
        node.variants.map(variant => (map[variant.name] ? renameEnumVariant(variant, map[variant.name]) : variant)),
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
