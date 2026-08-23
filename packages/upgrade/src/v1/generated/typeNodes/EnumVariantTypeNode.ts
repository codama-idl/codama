import type { EnumEmptyVariantTypeNode } from './EnumEmptyVariantTypeNode';
import type { EnumStructVariantTypeNode } from './EnumStructVariantTypeNode';
import type { EnumTupleVariantTypeNode } from './EnumTupleVariantTypeNode';

/** The variant flavours of an `enumTypeNode`. */
export type EnumVariantTypeNode = EnumEmptyVariantTypeNode | EnumStructVariantTypeNode | EnumTupleVariantTypeNode;
