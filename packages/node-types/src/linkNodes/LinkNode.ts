import type { AccountLinkNode } from './AccountLinkNode';
import type { DefinedTypeLinkNode } from './DefinedTypeLinkNode';
import type { PdaLinkNode } from './PdaLinkNode';
import type { ProgramLinkNode } from './ProgramLinkNode';

// Link Node Registration.
export type RegisteredLinkNode = AccountLinkNode | DefinedTypeLinkNode | PdaLinkNode | ProgramLinkNode;

// Link Node Helpers.
export type LinkNode = RegisteredLinkNode;
