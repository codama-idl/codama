import { EnumStructVariantTypeNode, enumStructVariantTypeNode, StructTypeNode } from '@codama/nodes';

import type { IdlV01DefinedFieldsNamed, IdlV01EnumVariant } from '../idl';
import type { GenericsV01 } from '../unwrapGenerics';
import { structTypeNodeFromAnchorV01 } from './StructTypeNode';

export function enumStructVariantTypeNodeFromAnchorV01(
    idl: IdlV01EnumVariant & { fields: IdlV01DefinedFieldsNamed },
    generics: GenericsV01,
): EnumStructVariantTypeNode<StructTypeNode> {
    return enumStructVariantTypeNode(
        idl.name ?? '',
        structTypeNodeFromAnchorV01({ fields: idl.fields, kind: 'struct' }, generics),
    );
}
