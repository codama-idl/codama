import type { AccountBumpValueNode } from './AccountBumpValueNode';
import type { AccountValueNode } from './AccountValueNode';
import type { ArgumentValueNode } from './ArgumentValueNode';
import type { ConditionalValueNode } from './ConditionalValueNode';
import type { IdentityValueNode } from './IdentityValueNode';
import type { PayerValueNode } from './PayerValueNode';
import type { PdaValueNode } from './PdaValueNode';
import type { ProgramIdValueNode } from './ProgramIdValueNode';
import type { ResolverValueNode } from './ResolverValueNode';

/** Every contextual-value node usable as a top-level value. */
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
