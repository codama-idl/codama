import { EnumEmptyVariantTypeNode, enumEmptyVariantTypeNode } from '@codama/nodes';

import { IdlV01EnumVariant } from '../idl';

export function enumEmptyVariantTypeNodeFromAnchorV01(idl: IdlV01EnumVariant): EnumEmptyVariantTypeNode {
    return enumEmptyVariantTypeNode(idl.name ?? '');
}
