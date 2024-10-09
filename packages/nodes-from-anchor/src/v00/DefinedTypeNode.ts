import { DefinedTypeNode, definedTypeNode } from '@codama/nodes';

import { IdlV00TypeDef } from './idl';
import { typeNodeFromAnchorV00 } from './typeNodes';

export function definedTypeNodeFromAnchorV00(idl: Partial<IdlV00TypeDef>): DefinedTypeNode {
    const name = idl.name ?? '';
    const idlType = idl.type ?? { fields: [], kind: 'struct' };
    const type = typeNodeFromAnchorV00(idlType);
    return definedTypeNode({ docs: idl.docs, name, type });
}
