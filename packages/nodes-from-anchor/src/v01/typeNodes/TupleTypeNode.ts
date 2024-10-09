import { TupleTypeNode, tupleTypeNode } from '@codama/nodes';

import { IdlV01DefinedFieldsTuple } from '../idl';
import { typeNodeFromAnchorV01 } from './TypeNode';

export function tupleTypeNodeFromAnchorV01(idl: IdlV01DefinedFieldsTuple): TupleTypeNode {
    return tupleTypeNode(idl.map(typeNodeFromAnchorV01));
}
