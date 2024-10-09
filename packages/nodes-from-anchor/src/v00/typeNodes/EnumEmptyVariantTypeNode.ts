import { EnumEmptyVariantTypeNode, enumEmptyVariantTypeNode } from '@codama/nodes';

import { IdlV00EnumVariant } from '../idl';

export function enumEmptyVariantTypeNodeFromAnchorV00(idl: IdlV00EnumVariant): EnumEmptyVariantTypeNode {
    return enumEmptyVariantTypeNode(idl.name ?? '');
}
