import {
    EnumTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    structFieldTypeNode,
    StructTypeNode,
    structTypeNode,
} from '@codama/nodes';

/**
 * Rename the fields of a struct using a map from current to new
 * identifiers. Identifiers are matched exactly; the struct's transforms and
 * plugins are preserved.
 */
export function renameStructNode(node: StructTypeNode, map: Record<string, string>): StructTypeNode {
    const renames = new Map(Object.entries(map));
    return structTypeNode(
        (node.fields ?? []).map(field => {
            const newIdentifier = renames.get(field.identifier);
            return newIdentifier ? structFieldTypeNode({ ...field, identifier: newIdentifier }) : field;
        }),
        { ...node },
    );
}

/**
 * Rename the variants of an enum using a map from current to new
 * identifiers. Identifiers are matched exactly; every other attribute of
 * the enum and its variants (discriminators, data, transforms, etc.) is
 * preserved.
 */
export function renameEnumNode(node: EnumTypeNode, map: Record<string, string>): EnumTypeNode {
    const renames = new Map(Object.entries(map));
    return enumTypeNode(
        (node.variants ?? []).map(variant => {
            const newIdentifier = renames.get(variant.identifier);
            return newIdentifier ? enumVariantTypeNode(newIdentifier, { ...variant }) : variant;
        }),
        { ...node },
    );
}
