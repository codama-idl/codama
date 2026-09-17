import type { AccountNode } from './AccountNode';
import type { ConstantNode } from './ConstantNode';
import type { RegisteredContextualValueNode } from './contextualValueNodes/RegisteredContextualValueNode';
import type { RegisteredCountNode } from './countNodes/RegisteredCountNode';
import type { DefinedTypeNode } from './DefinedTypeNode';
import type { RegisteredDiscriminatorNode } from './discriminatorNodes/RegisteredDiscriminatorNode';
import type { RegisteredDisplayNode } from './displayNodes/RegisteredDisplayNode';
import type { ErrorNode } from './ErrorNode';
import type { EventNode } from './EventNode';
import type { InstructionAccountNode } from './InstructionAccountNode';
import type { InstructionByteDeltaNode } from './InstructionByteDeltaNode';
import type { InstructionNode } from './InstructionNode';
import type { InstructionRemainingAccountsNode } from './InstructionRemainingAccountsNode';
import type { InstructionStatusNode } from './InstructionStatusNode';
import type { RegisteredLinkNode } from './linkNodes/RegisteredLinkNode';
import type { PdaNode } from './PdaNode';
import type { RegisteredPdaSeedNode } from './pdaSeedNodes/RegisteredPdaSeedNode';
import type { PluginNode } from './PluginNode';
import type { ProgramNode } from './ProgramNode';
import type { ProvidedNode } from './ProvidedNode';
import type { RootNode } from './RootNode';
import type { TextNode } from './TextNode';
import type { FixedSizeTransformNode } from './transformNodes/FixedSizeTransformNode';
import type { HiddenPrefixTransformNode } from './transformNodes/HiddenPrefixTransformNode';
import type { HiddenSuffixTransformNode } from './transformNodes/HiddenSuffixTransformNode';
import type { PostOffsetTransformNode } from './transformNodes/PostOffsetTransformNode';
import type { PreOffsetTransformNode } from './transformNodes/PreOffsetTransformNode';
import type { SentinelTransformNode } from './transformNodes/SentinelTransformNode';
import type { SizePrefixTransformNode } from './transformNodes/SizePrefixTransformNode';
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
    | FixedSizeTransformNode
    | HiddenPrefixTransformNode
    | HiddenSuffixTransformNode
    | InstructionAccountNode
    | InstructionByteDeltaNode
    | InstructionNode
    | InstructionRemainingAccountsNode
    | InstructionStatusNode
    | PdaNode
    | PluginNode
    | PostOffsetTransformNode
    | PreOffsetTransformNode
    | ProgramNode
    | ProvidedNode
    | RegisteredContextualValueNode
    | RegisteredCountNode
    | RegisteredDiscriminatorNode
    | RegisteredDisplayNode
    | RegisteredLinkNode
    | RegisteredPdaSeedNode
    | RegisteredTypeNode
    | RegisteredValueNode
    | RootNode
    | SentinelTransformNode
    | SizePrefixTransformNode
    | TextNode;

// Node Helpers.
export type GetNodeFromKind<TKind extends NodeKind> = Extract<Node, { kind: TKind }>;
