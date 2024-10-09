import { EnumStructVariantTypeNode, enumStructVariantTypeNode, StructTypeNode } from '@codama/nodes';

import { IdlV01DefinedFieldsNamed, IdlV01EnumVariant } from '../idl';
import { structTypeNodeFromAnchorV01 } from './StructTypeNode';

export function enumStructVariantTypeNodeFromAnchorV01(
    idl: IdlV01EnumVariant & { fields: IdlV01DefinedFieldsNamed },
): EnumStructVariantTypeNode<StructTypeNode> {
    return enumStructVariantTypeNode(
        idl.name ?? '',
        structTypeNodeFromAnchorV01({ fields: idl.fields, kind: 'struct' }),
    );
}
