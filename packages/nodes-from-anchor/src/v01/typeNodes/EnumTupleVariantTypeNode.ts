import { EnumTupleVariantTypeNode, enumTupleVariantTypeNode, TupleTypeNode } from '@codama/nodes';

import type { IdlV01DefinedFieldsTuple, IdlV01EnumVariant } from '../idl';
import type { GenericsV01 } from '../unwrapGenerics';
import { tupleTypeNodeFromAnchorV01 } from './TupleTypeNode';

export function enumTupleVariantTypeNodeFromAnchorV01(
    idl: IdlV01EnumVariant & { fields: IdlV01DefinedFieldsTuple },
    generics: GenericsV01,
): EnumTupleVariantTypeNode<TupleTypeNode> {
    return enumTupleVariantTypeNode(idl.name ?? '', tupleTypeNodeFromAnchorV01(idl.fields, generics));
}
