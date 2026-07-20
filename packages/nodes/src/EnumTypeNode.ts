import type { EnumTypeNode } from '@codama/node-types';

export function isScalarEnum(node: EnumTypeNode): boolean {
    return (node.variants ?? []).every(variant => variant.kind === 'enumEmptyVariantTypeNode');
}

export function isDataEnum(node: EnumTypeNode): boolean {
    return !isScalarEnum(node);
}
