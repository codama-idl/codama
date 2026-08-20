import type { FixedCountNode } from './FixedCountNode';
import type { PrefixedCountNode } from './PrefixedCountNode';
import type { RemainderCountNode } from './RemainderCountNode';

/** Every node tagged as a count strategy. */
export type RegisteredCountNode = FixedCountNode | PrefixedCountNode | RemainderCountNode;
