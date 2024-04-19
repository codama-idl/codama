import type { ArrayValueNode } from './ArrayValueNode';
import type { BooleanValueNode } from './BooleanValueNode';
import type { BytesValueNode } from './BytesValueNode';
import type { ConstantValueNode } from './ConstantValueNode';
import type { EnumValueNode } from './EnumValueNode';
import type { MapEntryValueNode } from './MapEntryValueNode';
import type { MapValueNode } from './MapValueNode';
import type { NoneValueNode } from './NoneValueNode';
import type { NumberValueNode } from './NumberValueNode';
import type { PublicKeyValueNode } from './PublicKeyValueNode';
import type { SetValueNode } from './SetValueNode';
import type { SomeValueNode } from './SomeValueNode';
import type { StringValueNode } from './StringValueNode';
import type { StructFieldValueNode } from './StructFieldValueNode';
import type { StructValueNode } from './StructValueNode';
import type { TupleValueNode } from './TupleValueNode';

// Standalone Value Node Registration.
export type StandaloneValueNode =
    | ArrayValueNode
    | BooleanValueNode
    | BytesValueNode
    | ConstantValueNode
    | EnumValueNode
    | MapValueNode
    | NoneValueNode
    | NumberValueNode
    | PublicKeyValueNode
    | SetValueNode
    | SomeValueNode
    | StringValueNode
    | StructValueNode
    | TupleValueNode;

// Value Node Registration.
export type RegisteredValueNode = MapEntryValueNode | StandaloneValueNode | StructFieldValueNode;

// Value Node Helper.
export type ValueNode = StandaloneValueNode;
