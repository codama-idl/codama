import { TupleTypeNode, tupleTypeNode } from '@kinobi-so/nodes';

import { IdlV00TypeTuple } from '../idl';
import { typeNodeFromAnchorV00 } from './TypeNode';

export function tupleTypeNodeFromAnchorV00(idl: IdlV00TypeTuple): TupleTypeNode {
    return tupleTypeNode(idl.tuple.map(typeNodeFromAnchorV00));
}
