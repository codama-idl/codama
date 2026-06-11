import type { EnumVariantTypeNode } from './EnumVariantTypeNode';
import type { StandaloneTypeNode } from './StandaloneTypeNode';
import type { StructFieldTypeNode } from './StructFieldTypeNode';

/** Every node tagged as a type-shaped node, including variants and struct fields. */
export type RegisteredTypeNode = EnumVariantTypeNode | StandaloneTypeNode | StructFieldTypeNode;
