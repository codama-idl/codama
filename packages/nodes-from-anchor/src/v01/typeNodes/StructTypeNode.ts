import { StructTypeNode, structTypeNode } from '@codama/nodes';

import type { IdlV01DefinedFields, IdlV01TypeDefTyStruct } from '../idl';
import type { GenericsV01 } from '../unwrapGenerics';
import { structFieldTypeNodeFromAnchorV01 } from './StructFieldTypeNode';

export function structTypeNodeFromAnchorV01(idl: IdlV01TypeDefTyStruct, generics: GenericsV01): StructTypeNode {
    const fields: IdlV01DefinedFields = idl.fields ?? [];

    return structTypeNode(fields.map(field => structFieldTypeNodeFromAnchorV01(field, generics)));
}
