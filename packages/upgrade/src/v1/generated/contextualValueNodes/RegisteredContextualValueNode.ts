import type { PdaSeedValueNode } from './PdaSeedValueNode';
import type { StandaloneContextualValueNode } from './StandaloneContextualValueNode';

/** Every node tagged as a contextual-value node, including helper variants. */
export type RegisteredContextualValueNode = PdaSeedValueNode | StandaloneContextualValueNode;
