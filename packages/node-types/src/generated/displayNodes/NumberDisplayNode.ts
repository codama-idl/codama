import type { AmountNumberDisplayNode } from './AmountNumberDisplayNode';
import type { UnitNumberDisplayNode } from './UnitNumberDisplayNode';

/** The presentation forms a number may take. Raw rendering is expressed by the absence of a display attribute. */
export type NumberDisplayNode = AmountNumberDisplayNode | UnitNumberDisplayNode;
