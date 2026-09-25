import { EnumTypeNode, enumTypeNode } from '@codama/nodes';

import type { IdlV01TypeDefTyEnum } from '../idl';
import type { GenericsV01 } from '../unwrapGenerics';
import { enumVariantTypeNodeFromAnchorV01 } from './EnumVariantTypeNode';

export function enumTypeNodeFromAnchorV01(idl: IdlV01TypeDefTyEnum, generics: GenericsV01): EnumTypeNode {
    return enumTypeNode(idl.variants.map(variant => enumVariantTypeNodeFromAnchorV01(variant, generics)));
}
