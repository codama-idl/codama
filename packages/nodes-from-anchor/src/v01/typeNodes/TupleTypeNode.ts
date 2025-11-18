import { TupleTypeNode, tupleTypeNode } from '@codama/nodes';

import type { IdlV01DefinedFieldsTuple } from '../idl';
import type { GenericsV01 } from '../unwrapGenerics';
import { typeNodeFromAnchorV01 } from './TypeNode';

export function tupleTypeNodeFromAnchorV01(idl: IdlV01DefinedFieldsTuple, generics: GenericsV01): TupleTypeNode {
    return tupleTypeNode(idl.map(type => typeNodeFromAnchorV01(type, generics)));
}
