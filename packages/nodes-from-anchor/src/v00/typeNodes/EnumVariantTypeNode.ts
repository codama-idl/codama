import { EnumVariantTypeNode, enumVariantTypeNode } from '@codama/nodes';

import type { IdlV00EnumFieldsNamed, IdlV00EnumFieldsTuple, IdlV00EnumVariant } from '../idl';
import { structTypeNodeFromAnchorV00 } from './StructTypeNode';
import { tupleTypeNodeFromAnchorV00 } from './TupleTypeNode';

/**
 * Convert an Anchor enum variant into an `enumVariantTypeNode` whose data
 * is absent (unit variant), a struct (named fields) or a tuple (unnamed
 * fields).
 */
export function enumVariantTypeNodeFromAnchorV00(idl: IdlV00EnumVariant): EnumVariantTypeNode {
    const name = idl.name ?? '';
    const fields = idl.fields ?? [];
    if (fields.length === 0) return enumVariantTypeNode(name);
    const data = isNamedFields(fields)
        ? structTypeNodeFromAnchorV00({ fields, kind: 'struct' })
        : tupleTypeNodeFromAnchorV00({ tuple: fields as IdlV00EnumFieldsTuple });
    return enumVariantTypeNode(name, { data });
}

function isNamedFields(fields: IdlV00EnumFieldsNamed | IdlV00EnumFieldsTuple): fields is IdlV00EnumFieldsNamed {
    const field = fields[0];
    return typeof field === 'object' && 'name' in field && 'type' in field;
}
