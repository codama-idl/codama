import { StructFieldTypeNode, structFieldTypeNode } from '@codama/nodes';

import { docsFromAnchor } from '../../utils';
import { IdlV00Field } from '../idl';
import { typeNodeFromAnchorV00 } from './TypeNode';

export function structFieldTypeNodeFromAnchorV00(idl: IdlV00Field): StructFieldTypeNode {
    return structFieldTypeNode({
        docs: docsFromAnchor(idl.docs),
        identifier: idl.name ?? '',
        type: typeNodeFromAnchorV00(idl.type),
    });
}
