import type { DefinedTypeLinkNode } from '../linkNodes/DefinedTypeLinkNode';
import type { StandaloneTypeNode } from './StandaloneTypeNode';

/** The composable form: any standalone type, or a reference to a defined type via `definedTypeLinkNode`. */
export type TypeNode = DefinedTypeLinkNode | StandaloneTypeNode;
