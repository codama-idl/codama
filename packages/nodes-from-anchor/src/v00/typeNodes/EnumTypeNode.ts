import { EnumTypeNode, enumTypeNode, integerTypeNode } from '@codama/nodes';

import type { IdlV00TypeDefTyEnum } from '../idl';
import { enumVariantTypeNodeFromAnchorV00 } from './EnumVariantTypeNode';

export function enumTypeNodeFromAnchorV00(idl: IdlV00TypeDefTyEnum): EnumTypeNode {
    return enumTypeNode(idl.variants.map(enumVariantTypeNodeFromAnchorV00), {
        size: idl.size ? integerTypeNode(idl.size) : undefined,
    });
}
