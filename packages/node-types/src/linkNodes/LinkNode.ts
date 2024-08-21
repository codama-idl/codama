import type { AccountLinkNode } from './AccountLinkNode';
import type { DefinedTypeLinkNode } from './DefinedTypeLinkNode';
import type { InstructionAccountLinkNode } from './InstructionAccountLinkNode';
import type { InstructionArgumentLinkNode } from './InstructionArgumentLinkNode';
import type { InstructionLinkNode } from './InstructionLinkNode';
import type { PdaLinkNode } from './PdaLinkNode';
import type { ProgramLinkNode } from './ProgramLinkNode';

// Link Node Registration.
export type RegisteredLinkNode =
    | AccountLinkNode
    | DefinedTypeLinkNode
    | InstructionAccountLinkNode
    | InstructionArgumentLinkNode
    | InstructionLinkNode
    | PdaLinkNode
    | ProgramLinkNode;

// Link Node Helpers.
export type LinkNode = RegisteredLinkNode;
