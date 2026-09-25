import { EnumVariantTypeNode, enumVariantTypeNode } from '@codama/nodes';

import type { IdlV01DefinedFieldsNamed, IdlV01DefinedFieldsTuple, IdlV01EnumVariant } from '../idl';
import type { GenericsV01 } from '../unwrapGenerics';
import { structTypeNodeFromAnchorV01 } from './StructTypeNode';
import { tupleTypeNodeFromAnchorV01 } from './TupleTypeNode';

/**
 * Convert an Anchor enum variant into an `enumVariantTypeNode` whose data
 * is absent (unit variant), a struct (named fields) or a tuple (unnamed
 * fields).
 */
export function enumVariantTypeNodeFromAnchorV01(idl: IdlV01EnumVariant, generics: GenericsV01): EnumVariantTypeNode {
    const fields = idl.fields ?? [];
    if (fields.length === 0) return enumVariantTypeNode(idl.name);
    const data = isNamedFields(fields)
        ? structTypeNodeFromAnchorV01({ fields, kind: 'struct' }, generics)
        : tupleTypeNodeFromAnchorV01(fields as IdlV01DefinedFieldsTuple, generics);
    return enumVariantTypeNode(idl.name, { data });
}

function isNamedFields(
    fields: IdlV01DefinedFieldsNamed | IdlV01DefinedFieldsTuple,
): fields is IdlV01DefinedFieldsNamed {
    const field = fields[0];
    return typeof field === 'object' && 'name' in field && 'type' in field;
}
