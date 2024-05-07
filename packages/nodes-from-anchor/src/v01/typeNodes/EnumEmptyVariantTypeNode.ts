import { EnumEmptyVariantTypeNode, enumEmptyVariantTypeNode } from '@kinobi-so/nodes';

import { IdlV01EnumVariant } from '../idl';

export function enumEmptyVariantTypeNodeFromAnchorV01(idl: IdlV01EnumVariant): EnumEmptyVariantTypeNode {
    return enumEmptyVariantTypeNode(idl.name ?? '');
}
