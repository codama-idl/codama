import { DefinedTypeNode, definedTypeNode } from '@codama/nodes';

import type { IdlV01TypeDef } from './idl';
import { typeNodeFromAnchorV01 } from './typeNodes';
import type { GenericsV01 } from './unwrapGenerics';

export function definedTypeNodeFromAnchorV01(idl: Partial<IdlV01TypeDef>, generics: GenericsV01): DefinedTypeNode {
    const name = idl.name ?? '';
    const idlType = idl.type ?? { fields: [], kind: 'struct' };
    const type = typeNodeFromAnchorV01(idlType, generics);
    return definedTypeNode({ docs: idl.docs, name, type });
}
