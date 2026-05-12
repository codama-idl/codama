import { ENUM_VARIANT_TYPE_NODE_KINDS } from './EnumVariantTypeNode';
import { STANDALONE_TYPE_NODE_KINDS } from './StandaloneTypeNode';

/** Every node tagged as a type-shaped node, including variants and struct fields. */
export const REGISTERED_TYPE_NODE_KINDS = [
    ...ENUM_VARIANT_TYPE_NODE_KINDS,
    ...STANDALONE_TYPE_NODE_KINDS,
    'structFieldTypeNode' as const,
];
