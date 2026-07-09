import type { AmountNumberDisplayNode } from './AmountNumberDisplayNode';
import type { DateTimeNumberDisplayNode } from './DateTimeNumberDisplayNode';
import type { DurationNumberDisplayNode } from './DurationNumberDisplayNode';
import type { EnumVariantDisplayNode } from './EnumVariantDisplayNode';
import type { InstructionAccountDisplayNode } from './InstructionAccountDisplayNode';
import type { InstructionDisplayNode } from './InstructionDisplayNode';
import type { StringDisplayNode } from './StringDisplayNode';
import type { StructFieldDisplayNode } from './StructFieldDisplayNode';

/** Every node tagged as display metadata. */
export type RegisteredDisplayNode =
    | AmountNumberDisplayNode
    | DateTimeNumberDisplayNode
    | DurationNumberDisplayNode
    | EnumVariantDisplayNode
    | InstructionAccountDisplayNode
    | InstructionDisplayNode
    | StringDisplayNode
    | StructFieldDisplayNode;
