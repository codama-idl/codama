import type { AmountNumberDisplayNode } from './AmountNumberDisplayNode';
import type { DateTimeNumberDisplayNode } from './DateTimeNumberDisplayNode';
import type { DurationNumberDisplayNode } from './DurationNumberDisplayNode';

/** The presentation forms a number may take. Raw rendering is expressed by the absence of a display attribute. */
export type NumberDisplayNode = AmountNumberDisplayNode | DateTimeNumberDisplayNode | DurationNumberDisplayNode;
