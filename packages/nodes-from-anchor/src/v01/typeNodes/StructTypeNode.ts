import { StructTypeNode, structTypeNode } from '@kinobi-so/nodes';

import { IdlV01DefinedFields, IdlV01TypeDefTyStruct } from '../idl';
import { structFieldTypeNodeFromAnchorV01 } from './StructFieldTypeNode';

export function structTypeNodeFromAnchorV01(idl: IdlV01TypeDefTyStruct): StructTypeNode {
    const fields: IdlV01DefinedFields = idl.fields ?? [];

    return structTypeNode(fields.map(structFieldTypeNodeFromAnchorV01));
}
