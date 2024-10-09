import { EnumStructVariantTypeNode, enumStructVariantTypeNode, StructTypeNode } from '@codama/nodes';

import { IdlV00EnumFieldsNamed, IdlV00EnumVariant } from '../idl';
import { structTypeNodeFromAnchorV00 } from './StructTypeNode';

export function enumStructVariantTypeNodeFromAnchorV00(
    idl: IdlV00EnumVariant & { fields: IdlV00EnumFieldsNamed },
): EnumStructVariantTypeNode<StructTypeNode> {
    return enumStructVariantTypeNode(
        idl.name ?? '',
        structTypeNodeFromAnchorV00({ fields: idl.fields, kind: 'struct' }),
    );
}
