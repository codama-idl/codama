import type { EnumTypeNode } from '@codama/node-types';

export function isScalarEnum(node: EnumTypeNode): boolean {
    return (node.variants ?? []).every(variant => variant.data === undefined);
}

export function isDataEnum(node: EnumTypeNode): boolean {
    return !isScalarEnum(node);
}
