import type {
    AccountLinkNode,
    AccountNode,
    ArrayTypeNode,
    BooleanTypeNode,
    BytesEncoding,
    BytesTypeNode,
    DateTimeTypeNode,
    DefinedTypeLinkNode,
    DefinedTypeNode,
    DurationTypeNode,
    EnumTypeNode,
    EnumVariantTypeNode,
    EventNode,
    FixedPointTypeNode,
    FloatTypeNode,
    InstructionLinkNode,
    InstructionNode,
    IntegerTypeNode,
    MapTypeNode,
    Node,
    OptionTypeNode,
    PublicKeyTypeNode,
    RegisteredTypeNode,
    RemainderOptionTypeNode,
    SetTypeNode,
    StandaloneTypeNode,
    StringTypeNode,
    StructFieldTypeNode,
    StructTypeNode,
    TupleTypeNode,
    ZeroableOptionTypeNode,
} from '@codama/nodes';
import { assertIsNodePath, isNodePath, type NodePath } from '@codama/visitors-core';
import type { Address } from '@solana/addresses';
import type { Codec, Option } from '@solana/codecs';

/**
 * The node kinds a decoded node can be about. Links are transparent: they
 * decode as the node they link to, e.g. a defined type link as the type of
 * its defined type.
 */
export type DecodableNode = AccountNode | DefinedTypeNode | EventNode | InstructionNode | RegisteredTypeNode;

/** The decoded value of an enum variant, e.g. `{ __kind: 'move', __discriminator: 2, data: { x: 1n } }`. */
export type EnumVariantValue = { __discriminator?: number; __kind: string; data?: unknown };

/** What codecs of decoded nodes encode: the value to encode, e.g. `{ value: { amount: 42n } }`. */
export type DecodedNodeInput = { readonly value: unknown };

/** The attributes shared by every decoded node. */
type DecodedNodeBase<TNode extends Node, TValue> = {
    /**
     * The position of the cursor, from the start of the bytes, after reading
     * the node, transforms included. Offset transforms may move it anywhere,
     * e.g. back to `preOffset` when they rewind.
     */
    readonly postOffset: number;
    /**
     * The position of the cursor, from the start of the bytes, before reading
     * the node, transforms included, e.g. before its size prefix.
     */
    readonly preOffset: number;
    /**
     * The path of the node that decoded the bytes, from the root. Links are
     * transparent, so the path of a linked type goes through its definition,
     * e.g. `[root, program, definedType, enumTypeNode]`.
     */
    readonly path: NodePath<TNode>;
    /** The decoded value, in the format of `getNodeValueCodec`. */
    readonly value: TValue;
};

/** A decoded account, e.g. `{ value: { count: 42n }, data: … }`. */
export type DecodedAccountNode = DecodedNodeBase<AccountNode, unknown> & {
    /** The decoded data of the account. */
    readonly data: DecodedTypeNode;
};

/** A decoded array, e.g. `{ value: [1n, 2n], items: […] }`. */
export type DecodedArrayTypeNode = DecodedNodeBase<ArrayTypeNode, unknown[]> & {
    /** The decoded items of the array. */
    readonly items: readonly DecodedTypeNode[];
};

/** A decoded boolean, e.g. `{ value: true }`. */
export type DecodedBooleanTypeNode = DecodedNodeBase<BooleanTypeNode, boolean>;

/** Decoded bytes, e.g. `{ value: ['base64', 'AQI='] }`. */
export type DecodedBytesTypeNode = DecodedNodeBase<BytesTypeNode, [BytesEncoding, string]>;

/** A decoded date-time, as its raw number of ticks, e.g. `{ value: 1700000000n }`. */
export type DecodedDateTimeTypeNode = DecodedNodeBase<DateTimeTypeNode, bigint>;

/** A decoded defined type, e.g. `{ value: 42n, type: … }`. */
export type DecodedDefinedTypeNode = DecodedNodeBase<DefinedTypeNode, unknown> & {
    /** The decoded type of the defined type. */
    readonly type: DecodedTypeNode;
};

/** A decoded duration, as its raw number of ticks, e.g. `{ value: 3600n }`. */
export type DecodedDurationTypeNode = DecodedNodeBase<DurationTypeNode, bigint>;

/** A decoded enum, e.g. `{ value: { __kind: 'quit', __discriminator: 0 }, variant: … }`. */
export type DecodedEnumTypeNode = DecodedNodeBase<EnumTypeNode, EnumVariantValue> & {
    /** The decoded variant of the enum, covering its discriminator. */
    readonly variant: DecodedEnumVariantTypeNode;
};

/** A decoded enum variant, e.g. `{ value: { __kind: 'move', __discriminator: 1, data: { x: 5n } }, data: … }`. */
export type DecodedEnumVariantTypeNode = DecodedNodeBase<EnumVariantTypeNode, EnumVariantValue> & {
    /** The decoded data of the variant, absent for variants without data. */
    readonly data?: DecodedTypeNode;
};

/** A decoded event, e.g. `{ value: { amount: 42n }, data: … }`. */
export type DecodedEventNode = DecodedNodeBase<EventNode, unknown> & {
    /** The decoded data of the event. */
    readonly data: DecodedTypeNode;
};

/** A decoded fixed point, as its raw number, e.g. `{ value: 12345n }` for `123.45` with a scale of 2. */
export type DecodedFixedPointTypeNode = DecodedNodeBase<FixedPointTypeNode, bigint>;

/** A decoded float, e.g. `{ value: 1.5 }`. */
export type DecodedFloatTypeNode = DecodedNodeBase<FloatTypeNode, number>;

/** A decoded instruction, e.g. `{ value: { amount: 42n }, data: … }`. */
export type DecodedInstructionNode = DecodedNodeBase<InstructionNode, unknown> & {
    /** The decoded data of the instruction, absent for instructions without data. */
    readonly data?: DecodedTypeNode;
};

/** A decoded integer, e.g. `{ value: 42n }`. */
export type DecodedIntegerTypeNode = DecodedNodeBase<IntegerTypeNode, bigint>;

/** A decoded map, e.g. `{ value: { 1: 'one' }, entries: [[key, value]] }`. */
export type DecodedMapTypeNode = DecodedNodeBase<MapTypeNode, Record<string, unknown>> & {
    /** The decoded entries of the map, keeping the decoded nodes of their keys. */
    readonly entries: readonly (readonly [key: DecodedTypeNode, value: DecodedTypeNode])[];
};

/** A decoded option, e.g. `{ value: { __option: 'Some', value: 42n }, item: … }`. */
export type DecodedOptionTypeNode = DecodedNodeBase<OptionTypeNode, Option<unknown>> & {
    /** The decoded item of the option, absent when `None`. */
    readonly item?: DecodedTypeNode;
};

/** A decoded public key, e.g. `{ value: '11111111111111111111111111111111' }`. */
export type DecodedPublicKeyTypeNode = DecodedNodeBase<PublicKeyTypeNode, Address>;

/** A decoded remainder option, e.g. `{ value: { __option: 'Some', value: 42n }, item: … }`. */
export type DecodedRemainderOptionTypeNode = DecodedNodeBase<RemainderOptionTypeNode, Option<unknown>> & {
    /** The decoded item of the option, absent when `None`. */
    readonly item?: DecodedTypeNode;
};

/** A decoded set, e.g. `{ value: [1n, 2n], items: […] }`. */
export type DecodedSetTypeNode = DecodedNodeBase<SetTypeNode, unknown[]> & {
    /** The decoded items of the set. */
    readonly items: readonly DecodedTypeNode[];
};

/** A decoded string, e.g. `{ value: 'hello' }`. */
export type DecodedStringTypeNode = DecodedNodeBase<StringTypeNode, string>;

/** A decoded struct field, e.g. `{ value: 42n, type: … }`. */
export type DecodedStructFieldTypeNode = DecodedNodeBase<StructFieldTypeNode, unknown> & {
    /** The decoded type of the field. */
    readonly type: DecodedTypeNode;
};

/** A decoded struct, e.g. `{ value: { amount: 42n }, fields: […] }`. */
export type DecodedStructTypeNode = DecodedNodeBase<StructTypeNode, Record<string, unknown>> & {
    /** The decoded fields of the struct, in order. */
    readonly fields: readonly DecodedStructFieldTypeNode[];
};

/** A decoded tuple, e.g. `{ value: [1n, 'a'], items: […] }`. */
export type DecodedTupleTypeNode = DecodedNodeBase<TupleTypeNode, unknown[]> & {
    /** The decoded items of the tuple. */
    readonly items: readonly DecodedTypeNode[];
};

/** A decoded zeroable option, e.g. `{ value: { __option: 'Some', value: 42n }, item: … }`. */
export type DecodedZeroableOptionTypeNode = DecodedNodeBase<ZeroableOptionTypeNode, Option<unknown>> & {
    /** The decoded item of the option, absent when `None`. */
    readonly item?: DecodedTypeNode;
};

/**
 * The decoded node of each decodable node kind. Indexing it with every
 * `DecodableNode['kind']` in {@link DecodedNode} fails to type-check if a
 * kind is missing.
 */
type DecodedNodeMap = {
    accountNode: DecodedAccountNode;
    arrayTypeNode: DecodedArrayTypeNode;
    booleanTypeNode: DecodedBooleanTypeNode;
    bytesTypeNode: DecodedBytesTypeNode;
    dateTimeTypeNode: DecodedDateTimeTypeNode;
    definedTypeNode: DecodedDefinedTypeNode;
    durationTypeNode: DecodedDurationTypeNode;
    enumTypeNode: DecodedEnumTypeNode;
    enumVariantTypeNode: DecodedEnumVariantTypeNode;
    eventNode: DecodedEventNode;
    fixedPointTypeNode: DecodedFixedPointTypeNode;
    floatTypeNode: DecodedFloatTypeNode;
    instructionNode: DecodedInstructionNode;
    integerTypeNode: DecodedIntegerTypeNode;
    mapTypeNode: DecodedMapTypeNode;
    optionTypeNode: DecodedOptionTypeNode;
    publicKeyTypeNode: DecodedPublicKeyTypeNode;
    remainderOptionTypeNode: DecodedRemainderOptionTypeNode;
    setTypeNode: DecodedSetTypeNode;
    stringTypeNode: DecodedStringTypeNode;
    structFieldTypeNode: DecodedStructFieldTypeNode;
    structTypeNode: DecodedStructTypeNode;
    tupleTypeNode: DecodedTupleTypeNode;
    zeroableOptionTypeNode: DecodedZeroableOptionTypeNode;
};

/**
 * A node decoded from bytes: the path of the node that decoded it, its value,
 * the cursor positions around it and the decoded nodes of its children, named after the
 * attributes of that node, e.g. the `fields` of a struct.
 *
 * Without a node type, any decoded node. With one, the decoded node of that
 * type, e.g. `DecodedNode<StructTypeNode>` is a {@link DecodedStructTypeNode}.
 *
 * @example
 * ```ts
 * // amount = struct { value: u64 }
 * const decoded = getNodeCodec([root, program, amount]).decode(bytes);
 * decoded.value; // { value: 42n }
 * assertIsDecodedNode(decoded.type, 'structTypeNode');
 * decoded.type.fields[0].type; // { path: [root, program, amount, struct, field, u64], value: 42n, preOffset: 0, postOffset: 8 }
 * ```
 */
export type DecodedNode<TNode extends DecodableNode = DecodableNode> = DecodedNodeMap[TNode['kind']];

/** The decoded nodes of the given node kind(s), e.g. {@link DecodedStructTypeNode} for `'structTypeNode'`. */
export type GetDecodedNodeFromKind<TKind extends DecodableNode['kind']> = DecodedNodeMap[TKind];

/** A codec of decoded nodes, encoding from `{ value }` and decoding into a {@link DecodedNode}. */
export type DecodedNodeCodec = Codec<DecodedNodeInput, DecodedNode>;

/** A decoded type, e.g. the type of a struct field, links being resolved. */
export type DecodedTypeNode = DecodedNode<StandaloneTypeNode>;

/** The decoded node of a node a codec can be created for, links being transparent. */
export type GetDecodedNode<TNode extends DecodableNode | AccountLinkNode | DefinedTypeLinkNode | InstructionLinkNode> =
    TNode extends AccountLinkNode
        ? DecodedAccountNode
        : TNode extends InstructionLinkNode
          ? DecodedInstructionNode
          : TNode extends DefinedTypeLinkNode
            ? DecodedTypeNode
            : TNode extends DecodableNode
              ? DecodedNode<TNode>
              : never;

/**
 * Whether the decoded node was decoded by a node of the given kind(s), which
 * narrows it to the decoded node of that kind, e.g. to access its children.
 *
 * @example
 * ```ts
 * if (isDecodedNode(field.type, 'structTypeNode')) {
 *     field.type.fields; // DecodedStructFieldTypeNode[]
 * }
 * ```
 */
export function isDecodedNode<TKind extends DecodableNode['kind']>(
    decoded: DecodedNode | null | undefined,
    kind: TKind | TKind[],
): decoded is GetDecodedNodeFromKind<TKind> {
    return !!decoded && isNodePath(decoded.path, kind);
}

/**
 * Assert that the decoded node was decoded by a node of the given kind(s),
 * which narrows it to the decoded node of that kind.
 *
 * @throws `CODAMA_ERROR__UNEXPECTED_NODE_KIND` when it was not.
 */
export function assertIsDecodedNode<TKind extends DecodableNode['kind']>(
    decoded: DecodedNode | null | undefined,
    kind: TKind | TKind[],
): asserts decoded is GetDecodedNodeFromKind<TKind> {
    assertIsNodePath(decoded?.path, kind);
}
