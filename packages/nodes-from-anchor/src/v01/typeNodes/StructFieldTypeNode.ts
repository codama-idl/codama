import { KINOBI_ERROR__UNRECOGNIZED_ANCHOR_IDL_TYPE, KinobiError } from '@kinobi-so/errors';
import { StructFieldTypeNode, structFieldTypeNode } from '@kinobi-so/nodes';

import { IdlV01Field, IdlV01Type } from '../idl';
import { typeNodeFromAnchorV01 } from './TypeNode';

export function structFieldTypeNodeFromAnchorV01(idl: IdlV01Field | IdlV01Type): StructFieldTypeNode {
    const field = idl as IdlV01Field;

    const isFieldDefinition = 'name' in field && 'type' in field;

    if (isFieldDefinition) {
        return structFieldTypeNode({
            docs: field.docs ?? [],
            name: field.name,
            type: typeNodeFromAnchorV01(field.type),
        });
    }

    throw new KinobiError(KINOBI_ERROR__UNRECOGNIZED_ANCHOR_IDL_TYPE, {
        idlType: JSON.stringify(idl),
    });
}
