import { EnumTupleVariantTypeNode, enumTupleVariantTypeNode, TupleTypeNode } from '@kinobi-so/nodes';

import { IdlV00EnumFieldsTuple, IdlV00EnumVariant } from '../idl';
import { tupleTypeNodeFromAnchorV00 } from './TupleTypeNode';

export function enumTupleVariantTypeNodeFromAnchorV00(
    idl: IdlV00EnumVariant & { fields: IdlV00EnumFieldsTuple },
): EnumTupleVariantTypeNode<TupleTypeNode> {
    return enumTupleVariantTypeNode(idl.name ?? '', tupleTypeNodeFromAnchorV00({ tuple: idl.fields }));
}
