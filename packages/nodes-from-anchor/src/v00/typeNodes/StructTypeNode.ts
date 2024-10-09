import { StructTypeNode, structTypeNode } from '@codama/nodes';

import { IdlV00TypeDefTyStruct } from '../idl';
import { structFieldTypeNodeFromAnchorV00 } from './StructFieldTypeNode';

export function structTypeNodeFromAnchorV00(idl: IdlV00TypeDefTyStruct): StructTypeNode {
    return structTypeNode((idl.fields ?? []).map(structFieldTypeNodeFromAnchorV00));
}
