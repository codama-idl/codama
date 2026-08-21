import type { AccountLinkNode } from './AccountLinkNode';
import type { DefinedTypeLinkNode } from './DefinedTypeLinkNode';
import type { InstructionAccountLinkNode } from './InstructionAccountLinkNode';
import type { InstructionArgumentLinkNode } from './InstructionArgumentLinkNode';
import type { InstructionLinkNode } from './InstructionLinkNode';
import type { PdaLinkNode } from './PdaLinkNode';
import type { ProgramLinkNode } from './ProgramLinkNode';

/** Every node tagged as a link to another part of the IDL. */
export type RegisteredLinkNode =
    | AccountLinkNode
    | DefinedTypeLinkNode
    | InstructionAccountLinkNode
    | InstructionArgumentLinkNode
    | InstructionLinkNode
    | PdaLinkNode
    | ProgramLinkNode;
