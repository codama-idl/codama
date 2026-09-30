import type { AccountBumpValueNode } from './AccountBumpValueNode';
import type { AccountDataValueNode } from './AccountDataValueNode';
import type { AccountValueNode } from './AccountValueNode';
import type { ConditionalValueNode } from './ConditionalValueNode';
import type { DataValueNode } from './DataValueNode';
import type { IdentityValueNode } from './IdentityValueNode';
import type { PayerValueNode } from './PayerValueNode';
import type { PdaValueNode } from './PdaValueNode';
import type { ProgramIdValueNode } from './ProgramIdValueNode';

/** Every contextual-value node usable as a top-level value. */
export type StandaloneContextualValueNode =
    | AccountBumpValueNode
    | AccountDataValueNode
    | AccountValueNode
    | ConditionalValueNode
    | DataValueNode
    | IdentityValueNode
    | PayerValueNode
    | PdaValueNode
    | ProgramIdValueNode;
