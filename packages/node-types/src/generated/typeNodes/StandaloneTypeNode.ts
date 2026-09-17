import type { ArrayTypeNode } from './ArrayTypeNode';
import type { BooleanTypeNode } from './BooleanTypeNode';
import type { BytesTypeNode } from './BytesTypeNode';
import type { DateTimeTypeNode } from './DateTimeTypeNode';
import type { DurationTypeNode } from './DurationTypeNode';
import type { EnumTypeNode } from './EnumTypeNode';
import type { FixedPointTypeNode } from './FixedPointTypeNode';
import type { FloatTypeNode } from './FloatTypeNode';
import type { IntegerTypeNode } from './IntegerTypeNode';
import type { MapTypeNode } from './MapTypeNode';
import type { OptionTypeNode } from './OptionTypeNode';
import type { PublicKeyTypeNode } from './PublicKeyTypeNode';
import type { RemainderOptionTypeNode } from './RemainderOptionTypeNode';
import type { SetTypeNode } from './SetTypeNode';
import type { StringTypeNode } from './StringTypeNode';
import type { StructTypeNode } from './StructTypeNode';
import type { TupleTypeNode } from './TupleTypeNode';
import type { ZeroableOptionTypeNode } from './ZeroableOptionTypeNode';

/** Every type node that can be used as a top-level type. */
export type StandaloneTypeNode =
    | ArrayTypeNode
    | BooleanTypeNode
    | BytesTypeNode
    | DateTimeTypeNode
    | DurationTypeNode
    | EnumTypeNode
    | FixedPointTypeNode
    | FloatTypeNode
    | IntegerTypeNode
    | MapTypeNode
    | OptionTypeNode
    | PublicKeyTypeNode
    | RemainderOptionTypeNode
    | SetTypeNode
    | StringTypeNode
    | StructTypeNode
    | TupleTypeNode
    | ZeroableOptionTypeNode;
