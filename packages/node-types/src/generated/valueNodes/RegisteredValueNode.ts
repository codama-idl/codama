import type { MapEntryValueNode } from './MapEntryValueNode';
import type { StandaloneValueNode } from './StandaloneValueNode';
import type { StructFieldValueNode } from './StructFieldValueNode';

/** Every node tagged as a value-shaped node, including container variants. */
export type RegisteredValueNode = MapEntryValueNode | StandaloneValueNode | StructFieldValueNode;
