import type { FixedCountNode } from './FixedCountNode';
import type { PrefixedCountNode } from './PrefixedCountNode';
import type { RemainderCountNode } from './RemainderCountNode';

// Count Node Registration.
export type RegisteredCountNode = FixedCountNode | PrefixedCountNode | RemainderCountNode;

// Count Node Helpers.
export type CountNode = RegisteredCountNode;
