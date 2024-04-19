import type { AccountNode } from './AccountNode';
import type { RegisteredContextualValueNode } from './contextualValueNodes/ContextualValueNode';
import type { RegisteredCountNode } from './countNodes/CountNode';
import type { DefinedTypeNode } from './DefinedTypeNode';
import type { RegisteredDiscriminatorNode } from './discriminatorNodes/DiscriminatorNode';
import type { ErrorNode } from './ErrorNode';
import type { InstructionAccountNode } from './InstructionAccountNode';
import type { InstructionArgumentNode } from './InstructionArgumentNode';
import type { InstructionByteDeltaNode } from './InstructionByteDeltaNode';
import type { InstructionNode } from './InstructionNode';
import type { InstructionRemainingAccountsNode } from './InstructionRemainingAccountsNode';
import type { RegisteredLinkNode } from './linkNodes/LinkNode';
import type { PdaNode } from './PdaNode';
import type { RegisteredPdaSeedNode } from './pdaSeedNodes/PdaSeedNode';
import type { ProgramNode } from './ProgramNode';
import type { RootNode } from './RootNode';
import type { RegisteredTypeNode } from './typeNodes/TypeNode';
import type { RegisteredValueNode } from './valueNodes/ValueNode';

// Node Registration.
export type NodeKind = Node['kind'];
export type Node =
    | AccountNode
    | DefinedTypeNode
    | ErrorNode
    | InstructionAccountNode
    | InstructionArgumentNode
    | InstructionByteDeltaNode
    | InstructionNode
    | InstructionRemainingAccountsNode
    | PdaNode
    | ProgramNode
    | RegisteredContextualValueNode
    | RegisteredCountNode
    | RegisteredDiscriminatorNode
    | RegisteredLinkNode
    | RegisteredPdaSeedNode
    | RegisteredTypeNode
    | RegisteredValueNode
    | RootNode;

// Node Helpers.
export type GetNodeFromKind<TKind extends NodeKind> = Extract<Node, { kind: TKind }>;
