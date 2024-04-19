import type { ProgramLinkNode } from '../linkNodes/ProgramLinkNode';
import type { ValueNode } from '../valueNodes/ValueNode';
import type { AccountBumpValueNode } from './AccountBumpValueNode';
import type { AccountValueNode } from './AccountValueNode';
import type { ArgumentValueNode } from './ArgumentValueNode';
import type { ConditionalValueNode } from './ConditionalValueNode';
import type { IdentityValueNode } from './IdentityValueNode';
import type { PayerValueNode } from './PayerValueNode';
import type { PdaSeedValueNode } from './PdaSeedValueNode';
import type { PdaValueNode } from './PdaValueNode';
import type { ProgramIdValueNode } from './ProgramIdValueNode';
import type { ResolverValueNode } from './ResolverValueNode';

// Standalone Contextual Value Node Registration.
export type StandaloneContextualValueNode =
    | AccountBumpValueNode
    | AccountValueNode
    | ArgumentValueNode
    | ConditionalValueNode
    | IdentityValueNode
    | PayerValueNode
    | PdaValueNode
    | ProgramIdValueNode
    | ResolverValueNode;

// Contextual Value Node Registration.
export type RegisteredContextualValueNode = PdaSeedValueNode | StandaloneContextualValueNode;

// Contextual Value Node Helpers.
export type ContextualValueNode = StandaloneContextualValueNode;
export type InstructionInputValueNode = ContextualValueNode | ProgramLinkNode | ValueNode;
