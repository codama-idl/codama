import type { AmountNumberDisplayNode } from './AmountNumberDisplayNode';
import type { EnumVariantDisplayNode } from './EnumVariantDisplayNode';
import type { InstructionAccountDisplayNode } from './InstructionAccountDisplayNode';
import type { InstructionDisplayNode } from './InstructionDisplayNode';
import type { StringDisplayNode } from './StringDisplayNode';
import type { StructFieldDisplayNode } from './StructFieldDisplayNode';
import type { UnitNumberDisplayNode } from './UnitNumberDisplayNode';

/** Every node tagged as display metadata. */
export type RegisteredDisplayNode =
    | AmountNumberDisplayNode
    | EnumVariantDisplayNode
    | InstructionAccountDisplayNode
    | InstructionDisplayNode
    | StringDisplayNode
    | StructFieldDisplayNode
    | UnitNumberDisplayNode;
