import type { FixedCountNode } from './FixedCountNode';
import type { PrefixedCountNode } from './PrefixedCountNode';
import type { RemainderCountNode } from './RemainderCountNode';
import type { SentinelCountNode } from './SentinelCountNode';

/** Every node tagged as a count strategy. */
export type RegisteredCountNode = FixedCountNode | PrefixedCountNode | RemainderCountNode | SentinelCountNode;
