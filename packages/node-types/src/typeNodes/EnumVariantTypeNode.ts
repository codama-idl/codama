import type { EnumEmptyVariantTypeNode } from './EnumEmptyVariantTypeNode';
import type { EnumStructVariantTypeNode } from './EnumStructVariantTypeNode';
import type { EnumTupleVariantTypeNode } from './EnumTupleVariantTypeNode';

export type EnumVariantTypeNode = EnumEmptyVariantTypeNode | EnumStructVariantTypeNode | EnumTupleVariantTypeNode;
