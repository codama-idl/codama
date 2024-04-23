import { StructFieldTypeNode, structFieldTypeNode } from '@kinobi-so/nodes';

import { IdlV00Field } from '../idl';
import { typeNodeFromAnchorV00 } from './TypeNode';

export function structFieldTypeNodeFromAnchorV00(idl: IdlV00Field): StructFieldTypeNode {
    return structFieldTypeNode({
        docs: idl.docs ?? [],
        name: idl.name ?? '',
        type: typeNodeFromAnchorV00(idl.type),
    });
}
