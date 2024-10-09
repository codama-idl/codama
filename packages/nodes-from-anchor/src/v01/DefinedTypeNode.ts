import { DefinedTypeNode, definedTypeNode } from '@codama/nodes';

import { IdlV01TypeDef } from './idl';
import { typeNodeFromAnchorV01 } from './typeNodes';

export function definedTypeNodeFromAnchorV01(idl: Partial<IdlV01TypeDef>): DefinedTypeNode {
    const name = idl.name ?? '';
    const idlType = idl.type ?? { fields: [], kind: 'struct' };
    const type = typeNodeFromAnchorV01(idlType);
    return definedTypeNode({ docs: idl.docs, name, type });
}
