import { EnumTupleVariantTypeNode, enumTupleVariantTypeNode, TupleTypeNode } from '@codama/nodes';

import { IdlV01DefinedFieldsTuple, IdlV01EnumVariant } from '../idl';
import { tupleTypeNodeFromAnchorV01 } from './TupleTypeNode';

export function enumTupleVariantTypeNodeFromAnchorV01(
    idl: IdlV01EnumVariant & { fields: IdlV01DefinedFieldsTuple },
): EnumTupleVariantTypeNode<TupleTypeNode> {
    return enumTupleVariantTypeNode(idl.name ?? '', tupleTypeNodeFromAnchorV01(idl.fields));
}
