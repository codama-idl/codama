import type { AmountTypeNode } from './AmountTypeNode';
import type { ArrayTypeNode } from './ArrayTypeNode';
import type { BooleanTypeNode } from './BooleanTypeNode';
import type { BytesTypeNode } from './BytesTypeNode';
import type { DateTimeTypeNode } from './DateTimeTypeNode';
import type { EnumTypeNode } from './EnumTypeNode';
import type { FixedSizeTypeNode } from './FixedSizeTypeNode';
import type { HiddenPrefixTypeNode } from './HiddenPrefixTypeNode';
import type { HiddenSuffixTypeNode } from './HiddenSuffixTypeNode';
import type { MapTypeNode } from './MapTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';
import type { OptionTypeNode } from './OptionTypeNode';
import type { PostOffsetTypeNode } from './PostOffsetTypeNode';
import type { PreOffsetTypeNode } from './PreOffsetTypeNode';
import type { PublicKeyTypeNode } from './PublicKeyTypeNode';
import type { RemainderOptionTypeNode } from './RemainderOptionTypeNode';
import type { SentinelTypeNode } from './SentinelTypeNode';
import type { SetTypeNode } from './SetTypeNode';
import type { SizePrefixTypeNode } from './SizePrefixTypeNode';
import type { SolAmountTypeNode } from './SolAmountTypeNode';
import type { StringTypeNode } from './StringTypeNode';
import type { StructTypeNode } from './StructTypeNode';
import type { TupleTypeNode } from './TupleTypeNode';
import type { ZeroableOptionTypeNode } from './ZeroableOptionTypeNode';

/** Every type node that can be used as a top-level type. */
export type StandaloneTypeNode =
    | AmountTypeNode
    | ArrayTypeNode
    | BooleanTypeNode
    | BytesTypeNode
    | DateTimeTypeNode
    | EnumTypeNode
    | FixedSizeTypeNode
    | HiddenPrefixTypeNode
    | HiddenSuffixTypeNode
    | MapTypeNode
    | NumberTypeNode
    | OptionTypeNode
    | PostOffsetTypeNode
    | PreOffsetTypeNode
    | PublicKeyTypeNode
    | RemainderOptionTypeNode
    | SentinelTypeNode
    | SetTypeNode
    | SizePrefixTypeNode
    | SolAmountTypeNode
    | StringTypeNode
    | StructTypeNode
    | TupleTypeNode
    | ZeroableOptionTypeNode;
