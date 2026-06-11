import type { AccountNode } from './AccountNode';
import type { ConstantNode } from './ConstantNode';
import type { RegisteredContextualValueNode } from './contextualValueNodes/RegisteredContextualValueNode';
import type { RegisteredCountNode } from './countNodes/RegisteredCountNode';
import type { DefinedTypeNode } from './DefinedTypeNode';
import type { RegisteredDiscriminatorNode } from './discriminatorNodes/RegisteredDiscriminatorNode';
import type { ErrorNode } from './ErrorNode';
import type { EventNode } from './EventNode';
import type { InstructionAccountNode } from './InstructionAccountNode';
import type { InstructionArgumentNode } from './InstructionArgumentNode';
import type { InstructionByteDeltaNode } from './InstructionByteDeltaNode';
import type { InstructionNode } from './InstructionNode';
import type { InstructionRemainingAccountsNode } from './InstructionRemainingAccountsNode';
import type { InstructionStatusNode } from './InstructionStatusNode';
import type { RegisteredLinkNode } from './linkNodes/RegisteredLinkNode';
import type { PdaNode } from './PdaNode';
import type { RegisteredPdaSeedNode } from './pdaSeedNodes/RegisteredPdaSeedNode';
import type { ProgramNode } from './ProgramNode';
import type { RootNode } from './RootNode';
import type { RegisteredTypeNode } from './typeNodes/RegisteredTypeNode';
import type { RegisteredValueNode } from './valueNodes/RegisteredValueNode';

// Node Registration.
export type NodeKind = Node['kind'];
export type Node =
    | AccountNode
    | ConstantNode
    | DefinedTypeNode
    | ErrorNode
    | EventNode
    | InstructionAccountNode
    | InstructionArgumentNode
    | InstructionByteDeltaNode
    | InstructionNode
    | InstructionRemainingAccountsNode
    | InstructionStatusNode
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
