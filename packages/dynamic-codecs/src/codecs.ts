import {
    CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
    CODAMA_ERROR__UNRECOGNIZED_BYTES_ENCODING,
    CODAMA_ERROR__UNRECOGNIZED_NUMBER_FORMAT,
    CodamaError,
} from '@codama/errors';
import {
    AccountLinkNode,
    AccountNode,
    BytesEncoding,
    ConstantValueNode,
    CountNode,
    DefinedTypeLinkNode,
    DefinedTypeNode,
    EventNode,
    FloatTypeNode,
    InstructionLinkNode,
    InstructionNode,
    IntegerTypeNode,
    isNode,
    RegisteredTypeNode,
    TransformNode,
    TYPE_NODE_KINDS,
    ValueNode,
} from '@codama/nodes';
import {
    getLastNodeFromPath,
    getRecordLinkablesVisitor,
    hasDefinedTypeFiniteValue,
    interceptVisitor,
    LinkableDictionary,
    mapVisitor,
    NodePath,
    NodeStack,
    pipe,
    ProvidedScope,
    recordNodeStackVisitor,
    recordProvidedScopeVisitor,
    visit,
    Visitor,
} from '@codama/visitors-core';
import { isAddress } from '@solana/addresses';
import {
    addCodecSentinel,
    addCodecSizePrefix,
    assertIsFixedSize,
    Codec,
    createCodec,
    Endian,
    fixCodecSize,
    FixedSizeNumberCodec,
    getArrayCodec,
    getBase16Codec,
    getBase58Codec,
    getBase64Codec,
    getBooleanCodec,
    getConstantCodec,
    getF32Codec,
    getF64Codec,
    getHiddenPrefixCodec,
    getHiddenSuffixCodec,
    getI8Codec,
    getI16Codec,
    getI32Codec,
    getI64Codec,
    getI128Codec,
    getOptionCodec,
    getShortU16Codec,
    getStructCodec,
    getTupleCodec,
    getU8Codec,
    getU16Codec,
    getU32Codec,
    getU64Codec,
    getU128Codec,
    getUnionCodec,
    getUnitCodec,
    getUtf8Codec,
    isFixedSize,
    isOption,
    isSome,
    none,
    NumberCodec,
    Option,
    OptionOrNullable,
    offsetCodec,
    padLeftCodec,
    padRightCodec,
    ReadonlyUint8Array,
    some,
    transformCodec,
} from '@solana/codecs';

import type {
    DecodedAccountNode,
    DecodedNodeCodec,
    DecodedArrayTypeNode,
    DecodedDefinedTypeNode,
    DecodedEnumTypeNode,
    DecodedEnumVariantTypeNode,
    DecodedEventNode,
    DecodedInstructionNode,
    DecodedMapTypeNode,
    DecodedNode,
    DecodedNodeInput,
    DecodedOptionTypeNode,
    DecodedRemainderOptionTypeNode,
    DecodedSetTypeNode,
    DecodedStructFieldTypeNode,
    DecodedStructTypeNode,
    DecodedTupleTypeNode,
    DecodedTypeNode,
    DecodedZeroableOptionTypeNode,
    EnumVariantValue,
    GetDecodedNode,
} from './decoded';
import { getLazyCodec } from './lazy';
import {
    assertUniqueItems,
    assertValueType,
    formatValueType,
    getUnexpectedValueTypeError,
    isObjectRecord,
} from './validation';
import { getValueNodeVisitor } from './values';

/** The node kinds a codec can be created for. */
export type EncodableNodes =
    | AccountLinkNode
    | AccountNode
    | DefinedTypeLinkNode
    | DefinedTypeNode
    | EventNode
    | InstructionLinkNode
    | InstructionNode
    | RegisteredTypeNode;

/** Options shared by {@link getNodeCodec}, {@link getNodeValueCodec} and their visitors. */
export type CodecVisitorOptions = {
    /** The encoding used to decode plain bytes, e.g. `["base64", "SGVsbG8="]`. Defaults to `base64`. */
    bytesEncoding?: BytesEncoding;
};

/** A decoded node before its cursor positions are known, which the outermost layer of its codec adds. */
type Unranged<TDecoded extends DecodedNode> = TDecoded extends unknown
    ? Omit<TDecoded, 'postOffset' | 'preOffset'>
    : never;

/** Bytes as `[encoding, data]` tuples, e.g. `["base16", "0102"]`, or as raw bytes when encoding. */
type BytesValue = ReadonlyUint8Array | Uint8Array | [BytesEncoding, string];

// Derived from a record so that adding a bytes encoding without listing it here is a type error.
const BYTES_ENCODINGS: readonly unknown[] = Object.keys({
    base16: true,
    base58: true,
    base64: true,
    utf8: true,
} satisfies Record<BytesEncoding, true>);

function isUint8Array(value: unknown): value is ReadonlyUint8Array | Uint8Array {
    return value instanceof Uint8Array;
}

function isBytesValue(value: unknown): value is BytesValue {
    if (isUint8Array(value)) return true;
    return (
        Array.isArray(value) && value.length === 2 && BYTES_ENCODINGS.includes(value[0]) && typeof value[1] === 'string'
    );
}

function isInteger(value: unknown): value is bigint | number {
    return typeof value === 'bigint' || (typeof value === 'number' && Number.isInteger(value));
}

/**
 * Get a codec decoding the node at the end of the given path into a {@link DecodedNode}:
 * the decoded value, together with the path of the node that decoded it, the cursor
 * positions around it and the decoded nodes of its children, e.g. the fields of a struct.
 * It encodes from
 * `{ value }`, where `value` is in the format of {@link getNodeValueCodec}.
 *
 * The full path, from the root node, is needed to resolve link nodes and injected
 * values, e.g. `[root, program, definedType]`.
 *
 * @example
 * ```ts
 * const codec = getNodeCodec([root, program, definedType]);
 * const bytes = codec.encode({ value: { amount: 42n } });
 * const decoded = codec.decode(bytes);
 * decoded.value; // { amount: 42n }
 * decoded.type; // the decoded struct, with its `fields`
 * ```
 */
export function getNodeCodec<TNode extends EncodableNodes>(
    path: NodePath<TNode>,
    options: CodecVisitorOptions = {},
): Codec<DecodedNodeInput, GetDecodedNode<TNode>> {
    const linkables = new LinkableDictionary();
    visit(path[0], getRecordLinkablesVisitor(linkables));

    // Open a frame for every enclosing instruction, so the ones `provides` resolve injected values.
    const ancestors = path.slice(0, -1);
    const frames = ancestors.flatMap(node => (isNode(node, 'instructionNode') ? [node.provides ?? []] : []));

    const codec = visit(
        getLastNodeFromPath(path) as EncodableNodes,
        getNodeCodecVisitor(linkables, {
            ...options,
            scope: new ProvidedScope(...frames),
            stack: new NodeStack(ancestors),
        }),
    );
    return codec as Codec<DecodedNodeInput, GetDecodedNode<TNode>>;
}

/**
 * Get a codec for the node at the end of the given path. Values are raw JavaScript
 * values, e.g. integers are `bigint`s and enums are `{ __kind, __discriminator, data }`.
 * It is the value of the decoded nodes of {@link getNodeCodec}.
 *
 * The full path, from the root node, is needed to resolve link nodes and injected
 * values, e.g. `[root, program, definedType]`.
 *
 * Encoding rejects values of the wrong type, e.g. a string for an integer, with a
 * `DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` error whose `nodePath` is the path of the
 * node that rejected the value. Missing values are only accepted by options, which
 * encode them as `None`, structs, whose fields then use their default values, and
 * struct fields with default values.
 *
 * @example
 * ```ts
 * const codec = getNodeValueCodec([root, program, definedType]);
 * const bytes = codec.encode({ amount: 42n });
 * const value = codec.decode(bytes);
 * ```
 */
export function getNodeValueCodec(path: NodePath<EncodableNodes>, options: CodecVisitorOptions = {}): Codec<unknown> {
    return getValueCodec(getNodeCodec(path, options));
}

/**
 * A visitor that returns a codec for the visited node, as described by {@link getNodeValueCodec}.
 *
 * The `stack` must hold the ancestors of the visited node to resolve link nodes, and the
 * `scope` must hold the `provides` of its enclosing instructions to resolve injected values.
 */
export function getNodeValueCodecVisitor(
    linkables: LinkableDictionary,
    options: CodecVisitorOptions & { scope?: ProvidedScope; stack?: NodeStack } = {},
): Visitor<Codec<unknown>, EncodableNodes['kind']> {
    return mapVisitor(getNodeCodecVisitor(linkables, options), getValueCodec);
}

/** The codec of the values of the decoded nodes of the given codec. */
function getValueCodec(codec: DecodedNodeCodec): Codec<unknown> {
    return transformCodec(
        codec,
        (value: unknown): DecodedNodeInput => ({ value }),
        decoded => decoded.value,
    );
}

/**
 * A visitor that returns a codec of decoded nodes for the visited node, as described
 * by {@link getNodeCodec}.
 *
 * The `stack` must hold the ancestors of the visited node to resolve link nodes, and the
 * `scope` must hold the `provides` of its enclosing instructions to resolve injected values.
 */
export function getNodeCodecVisitor(
    linkables: LinkableDictionary,
    options: CodecVisitorOptions & { scope?: ProvidedScope; stack?: NodeStack } = {},
): Visitor<DecodedNodeCodec, EncodableNodes['kind']> {
    const stack = options.stack ?? new NodeStack();
    const scope = options.scope ?? new ProvidedScope();
    const bytesEncoding = options.bytesEncoding ?? 'base64';

    // Constants, sizes and prefixes are encoded with the value codecs of their types.
    let valueCodecVisitor: Visitor<Codec<unknown>, EncodableNodes['kind']> | undefined;
    const getValueCodecVisitor = () => (valueCodecVisitor ??= mapVisitor(visitor, getValueCodec));
    const visitValueCodec = (node: EncodableNodes): Codec<unknown> => visit(node, getValueCodecVisitor());
    const valueNodeVisitor = getValueNodeVisitor(linkables, {
        codecVisitorFactory: getValueCodecVisitor,
        scope,
        stack,
    });
    const getConstantBytes = (node: ConstantValueNode) =>
        getConstantValueBytes(node, getValueCodecVisitor(), valueNodeVisitor);

    // Default values are only evaluated when needed, e.g. an injected default only throws if
    // the input does not provide the field. Since they are evaluated when encoding, by which
    // point the live `stack` and `scope` have unwound, they cannot reuse `valueNodeVisitor`: they
    // get their own value visitor, and thus codec visitor for constants, bound to clones of
    // the `stack` and `scope` taken when the codec is created, so links and injections resolve
    // from where the default value is defined.
    const getDefaultValueGetter = (defaultValue: ValueNode): (() => unknown) => {
        const defaultValueVisitor = getValueNodeVisitor(linkables, {
            codecVisitorOptions: { bytesEncoding },
            scope: scope.clone(),
            stack: stack.clone(),
        });
        let resolved: { value: unknown } | undefined;
        return () => (resolved ??= { value: visit(defaultValue, defaultValueVisitor) }).value;
    };

    // The codecs of the defined types being created, so a link back to one of them gets a lazy
    // codec deferring to it rather than creating it again forever, e.g. for linked lists.
    const definedTypesInProgress = new Map<DefinedTypeNode, { codec?: DecodedNodeCodec }>();
    // The recursive types known to have a finite value, so each is only checked once.
    const finiteDefinedTypes = new Set<DefinedTypeNode>();
    const getRecursiveCodec = (path: NodePath<DefinedTypeNode>, inProgress: { codec?: DecodedNodeCodec }) => {
        // A type without a finite value would make its lazy codec recurse forever.
        const definedType = getLastNodeFromPath(path);
        if (!finiteDefinedTypes.has(definedType)) {
            if (!hasDefinedTypeFiniteValue(path, linkables)) {
                throw new CodamaError(CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE, {
                    name: definedType.identifier,
                    path,
                });
            }
            finiteDefinedTypes.add(definedType);
        }
        return getLazyCodec(() => {
            if (inProgress.codec) return inProgress.codec;
            // Only reachable when creating the type requires encoding a value of itself, e.g. a
            // constant typed by a link back to it, nested where the finite value check does not look.
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
                message: `The codec of defined type [${getLastNodeFromPath(path).identifier}] was used while being created`,
            });
        });
    };

    // The absolute offsets of the first bytes being read, one per nested read of bytes that a
    // transform sliced, e.g. a size prefix reads its data from a copy of the bytes it prefixes.
    const baseOffsets: number[] = [0];
    const getBaseOffset = () => baseOffsets[baseOffsets.length - 1];

    // The outermost layer of every codec records the absolute cursor positions around its node,
    // completing the decoded node its inner layers created without them.
    const withRange = (codec: DecodedNodeCodec): DecodedNodeCodec =>
        mapCodecRead(codec, read => (bytes, offset) => {
            const [decoded, newOffset] = read(bytes, offset);
            const baseOffset = getBaseOffset();
            return [{ ...decoded, postOffset: baseOffset + newOffset, preOffset: baseOffset + offset }, newOffset];
        });

    // Codecs decoding nodes without their cursor positions, which `withRange` adds on top of them.
    const toDecodedNodeCodec = (codec: Codec<DecodedNodeInput | undefined, Unranged<DecodedNode>>): DecodedNodeCodec =>
        codec as DecodedNodeCodec;

    // Transforms that read their inner codec from a copy of some of the bytes they read keep
    // track of where that copy starts, so the cursor positions of inner nodes remain absolute.
    const withSlicedBytes = (
        codec: DecodedNodeCodec,
        transform: (codec: DecodedNodeCodec) => DecodedNodeCodec,
        getSliceStart: (bytes: ReadonlyUint8Array | Uint8Array, offset: number) => number,
    ): DecodedNodeCodec => {
        const reads: { baseOffset: number; bytes: ReadonlyUint8Array | Uint8Array; offset: number }[] = [];
        const inner = mapCodecRead(codec, read => (bytes, offset) => {
            const outer = reads[reads.length - 1];
            const sliced = bytes !== outer.bytes;
            baseOffsets.push(sliced ? outer.baseOffset + getSliceStart(outer.bytes, outer.offset) : outer.baseOffset);
            try {
                return read(bytes, offset);
            } finally {
                baseOffsets.pop();
            }
        });
        return mapCodecRead(transform(inner), read => (bytes, offset) => {
            reads.push({ baseOffset: getBaseOffset(), bytes, offset });
            try {
                return read(bytes, offset);
            } finally {
                reads.pop();
            }
        });
    };

    const visitLinkedNode = <TLinkNode extends AccountLinkNode | DefinedTypeLinkNode | InstructionLinkNode>(
        node: TLinkNode,
    ) => {
        const path = linkables.getPathOrThrow(stack.getPath(node.kind) as NodePath<TLinkNode>);
        return stack.visitPath(path, visitor);
    };

    // Leaves decode as their value only, whose type their own codec ensures. A missing input
    // is a missing value, e.g. the items missing from a tuple, which the tuple codec reads by index.
    const getLeafCodec = (codec: Codec<unknown>): DecodedNodeCodec => {
        const path = stack.getPath();
        return toDecodedNodeCodec(
            transformCodec(
                codec,
                (input: DecodedNodeInput | undefined) => input?.value,
                value => ({ path, value }) as Unranged<DecodedNode>,
            ),
        );
    };

    // Composite nodes decode as their value and the decoded nodes of their children. Each
    // caller builds its decoded node, checked against its type with `satisfies`.
    const getCompositeCodec = <TFrom, TTo extends TFrom>(
        codec: Codec<TFrom, TTo>,
        toChildren: (value: unknown) => TFrom,
        fromChildren: (children: TTo) => Unranged<DecodedNode>,
    ): DecodedNodeCodec =>
        toDecodedNodeCodec(
            transformCodec(codec, (input: DecodedNodeInput | undefined) => toChildren(input?.value), fromChildren),
        );

    // Arrays and sets are encoded from arrays, and build their decoded node from their items.
    const getArrayLikeCodec = (
        item: DecodedNodeCodec,
        count: CountNode,
        fromItems: (items: DecodedTypeNode[], value: unknown[]) => Unranged<DecodedNode>,
        assertItems?: (items: readonly unknown[]) => void,
    ): DecodedNodeCodec => {
        const nodePath = stack.getPath();
        return getCompositeCodec(
            getCollectionCodec(item, count),
            value => {
                if (!Array.isArray(value)) throw getUnexpectedValueTypeError(nodePath, 'array', value);
                assertItems?.(value);
                return value.map((itemValue: unknown) => ({ value: itemValue }));
            },
            decodedItems => {
                const items = decodedItems as DecodedTypeNode[];
                return fromItems(
                    items,
                    items.map(decoded => decoded.value),
                );
            },
        );
    };

    // Options encode missing values as `None`, like `null`, and build their decoded node from
    // their item, if any.
    const getOptionLikeCodec = (
        optionCodec: Codec<OptionOrNullable<DecodedNodeInput>, Option<DecodedNode>>,
        fromItem: (item: DecodedTypeNode | undefined, value: Option<unknown>) => Unranged<DecodedNode>,
    ): DecodedNodeCodec =>
        getCompositeCodec(
            optionCodec,
            value => {
                if (value === undefined || value === null) return none();
                if (isOption(value)) return isSome(value) ? some({ value: value.value }) : none();
                return some({ value });
            },
            option => {
                if (!isSome(option)) return fromItem(undefined, none());
                const item = option.value as DecodedTypeNode;
                return fromItem(item, some(item.value));
            },
        );

    const getCollectionCodec = <TFrom, TTo extends TFrom>(
        item: Codec<TFrom, TTo>,
        count: CountNode,
    ): Codec<TFrom[], TTo[]> => {
        switch (count.kind) {
            case 'fixedCountNode':
                return getArrayCodec(item, { size: count.value });
            case 'prefixedCountNode':
                return getArrayCodec(item, { size: visitValueCodec(count.prefix) as NumberCodec });
            case 'remainderCountNode':
                return getArrayCodec(item, { size: 'remainder' });
            case 'sentinelCountNode': {
                const sentinel = getConstantBytes(count.sentinel);
                return getArrayCodec(item, { size: { __kind: 'sentinel', sentinel, strategy: count.strategy } });
            }
        }
    };

    const applyTransform = (codec: DecodedNodeCodec, transform: TransformNode): DecodedNodeCodec => {
        switch (transform.kind) {
            case 'fixedSizeTransformNode':
                return withSlicedBytes(
                    codec,
                    inner => fixCodecSize(inner, transform.size),
                    (_, offset) => offset,
                );
            case 'sizePrefixTransformNode': {
                const prefix = visitValueCodec(transform.prefix) as NumberCodec;
                return withSlicedBytes(
                    codec,
                    inner => addCodecSizePrefix(inner, prefix),
                    (bytes, offset) => prefix.read(bytes, offset)[1],
                );
            }
            case 'sentinelTransformNode': {
                const sentinel = getConstantBytes(transform.sentinel);
                return withSlicedBytes(
                    codec,
                    inner => addCodecSentinel(inner, sentinel),
                    (_, offset) => offset,
                );
            }
            case 'hiddenPrefixTransformNode':
                return getHiddenPrefixCodec(
                    codec,
                    (transform.prefix ?? []).map(constant => getConstantCodec(getConstantBytes(constant))),
                );
            case 'hiddenSuffixTransformNode':
                return getHiddenSuffixCodec(
                    codec,
                    (transform.suffix ?? []).map(constant => getConstantCodec(getConstantBytes(constant))),
                );
            case 'preOffsetTransformNode': {
                const { offset } = transform;
                switch (transform.strategy) {
                    case 'padded':
                        return padLeftCodec(codec, offset);
                    case 'absolute':
                        return offsetCodec(codec, {
                            preOffset: ({ wrapBytes }) => (offset < 0 ? wrapBytes(offset) : offset),
                        });
                    case 'relative':
                        return offsetCodec(codec, { preOffset: ({ preOffset }) => preOffset + offset });
                }
                break;
            }
            case 'postOffsetTransformNode': {
                const { offset } = transform;
                switch (transform.strategy) {
                    case 'padded':
                        return padRightCodec(codec, offset);
                    case 'absolute':
                        return offsetCodec(codec, {
                            postOffset: ({ wrapBytes }) => (offset < 0 ? wrapBytes(offset) : offset),
                        });
                    case 'preOffset':
                        return offsetCodec(codec, { postOffset: ({ preOffset }) => preOffset + offset });
                    case 'relative':
                        return offsetCodec(codec, { postOffset: ({ postOffset }) => postOffset + offset });
                }
                break;
            }
        }
        return codec;
    };

    const baseVisitor: Visitor<DecodedNodeCodec, EncodableNodes['kind']> = {
        visitAccount(node) {
            const path = stack.getPath('accountNode');
            return getCompositeCodec(
                visit(node.data, this),
                value => ({ value }),
                decoded => {
                    const data = decoded as DecodedTypeNode;
                    return { data, path, value: data.value } satisfies Unranged<DecodedAccountNode>;
                },
            );
        },
        visitAccountLink(node) {
            return visitLinkedNode(node);
        },
        visitArrayType(node) {
            const path = stack.getPath('arrayTypeNode');
            return getArrayLikeCodec(
                visit(node.item, this),
                node.count,
                (items, value) => ({ items, path, value }) satisfies Unranged<DecodedArrayTypeNode>,
            );
        },
        visitBooleanType(node) {
            const size = visitValueCodec(node.size) as FixedSizeNumberCodec;
            const codec = getBooleanCodec({ size }) as Codec<unknown>;
            return getLeafCodec(
                assertValueType(codec, stack.getPath(), 'boolean', value => typeof value === 'boolean'),
            );
        },
        visitBytesType() {
            // Bytes decode as `[encoding, data]` tuples, e.g. `["base64", "SGVsbG8="]`, rather
            // than `Uint8Arrays` in order to be compatible with JSON. Both encode.
            const codec = createCodec<BytesValue, [BytesEncoding, string]>({
                getSizeFromValue: value => {
                    if (isUint8Array(value)) return value.length;
                    const [encoding, data] = value;
                    return getCodecFromBytesEncoding(encoding).getSizeFromValue(data);
                },
                read: (bytes, offset) => {
                    const [value, newOffset] = getCodecFromBytesEncoding(bytesEncoding).read(bytes, offset);
                    return [[bytesEncoding, value], newOffset];
                },
                write: (value, bytes, offset) => {
                    if (isUint8Array(value)) {
                        bytes.set(value, offset);
                        return offset + value.length;
                    }
                    const [encoding, data] = value;
                    return getCodecFromBytesEncoding(encoding).write(data, bytes, offset);
                },
            }) as Codec<unknown>;
            return getLeafCodec(
                assertValueType(codec, stack.getPath(), 'Uint8Array | [BytesEncoding, string]', isBytesValue),
            );
        },
        visitDateTimeType(node) {
            return getLeafCodec(visitValueCodec(node.number));
        },
        visitDefinedType(node) {
            const path = stack.getPath('definedTypeNode');
            const inProgress: { codec?: DecodedNodeCodec } = {};
            definedTypesInProgress.set(node, inProgress);
            try {
                const codec = getCompositeCodec(
                    visit(node.type, this),
                    value => ({ value }),
                    decoded => {
                        const type = decoded as DecodedTypeNode;
                        return { path, type, value: type.value } satisfies Unranged<DecodedDefinedTypeNode>;
                    },
                );
                // Links back to this type read it through `inProgress`, so it must have its cursor positions.
                inProgress.codec = withRange(codec);
                return codec;
            } finally {
                definedTypesInProgress.delete(node);
            }
        },
        visitDefinedTypeLink(node) {
            const path = linkables.getPathOrThrow(stack.getPath(node.kind));
            const inProgress = definedTypesInProgress.get(getLastNodeFromPath(path));
            const definedTypeCodec = inProgress ? getRecursiveCodec(path, inProgress) : stack.visitPath(path, visitor);
            // Links are transparent: they decode as the type of their defined type.
            return transformCodec(
                definedTypeCodec,
                (input: DecodedNodeInput) => input,
                decoded => (decoded as DecodedDefinedTypeNode).type,
            );
        },
        visitDurationType(node) {
            return getLeafCodec(visitValueCodec(node.number));
        },
        visitEnumType(node) {
            const size = visitValueCodec(node.size) as NumberCodec;
            const variants = node.variants ?? [];
            // Each variant codec encodes its own discriminator prefix, see `visitEnumVariantType`.
            const discriminators = variants.map((variant, index) => variant.discriminator ?? index);
            const nodePath = stack.getPath('enumTypeNode');
            const union = getUnionCodec(
                variants.map(variant => visit(variant, this)),
                (input: DecodedNodeInput) => {
                    const { __kind } = input.value as EnumVariantValue;
                    const index = variants.findIndex(variant => variant.identifier === __kind);
                    if (index < 0) {
                        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
                            actualType: `variant '${String(__kind)}'`,
                            expectedType: `one of [${variants.map(variant => variant.identifier).join(', ')}]`,
                            nodeKind: 'enumTypeNode',
                            nodePath,
                        });
                    }
                    return index;
                },
                (bytes, offset) => discriminators.indexOf(Number(size.read(bytes, offset)[0])),
            );
            return getCompositeCodec(
                union,
                // Variants without data may also be encoded from their identifier, e.g. `'frozen'`.
                value => {
                    if (typeof value === 'string') return { value: { __kind: value } };
                    if (isObjectRecord(value) && typeof value.__kind === 'string') return { value };
                    throw getUnexpectedValueTypeError(nodePath, 'string | { __kind: string }', value);
                },
                decoded => {
                    const variant = decoded as DecodedEnumVariantTypeNode;
                    return { path: nodePath, value: variant.value, variant } satisfies Unranged<DecodedEnumTypeNode>;
                },
            );
        },
        visitEnumVariantType(node) {
            const __kind = node.identifier;
            const nodePath = stack.getPath('enumVariantTypeNode');
            const getData = (value: unknown): unknown => {
                // Within an enum, the enum already ensures the value is an object of this variant.
                if (!isObjectRecord(value) || value.__kind !== __kind) {
                    const expectedType =
                        node.data === undefined ? `{ __kind: '${__kind}' }` : `{ __kind: '${__kind}', data }`;
                    const actualType = isObjectRecord(value)
                        ? `variant '${String(value.__kind)}'`
                        : formatValueType(value);
                    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
                        actualType,
                        expectedType,
                        nodeKind: 'enumVariantTypeNode',
                        nodePath,
                    });
                }
                if (node.data === undefined) return undefined;
                if (value.data === undefined) {
                    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
                        actualType: `variant '${__kind}' without data`,
                        expectedType: `{ __kind: '${__kind}', data }`,
                        nodeKind: 'enumVariantTypeNode',
                        nodePath,
                    });
                }
                return value.data;
            };
            const codec: DecodedNodeCodec = node.data
                ? getCompositeCodec(
                      visit(node.data, this),
                      value => ({ value: getData(value) }),
                      decoded => {
                          const data = decoded as DecodedTypeNode;
                          const value = { __kind, data: data.value };
                          return { data, path: nodePath, value } satisfies Unranged<DecodedEnumVariantTypeNode>;
                      },
                  )
                : getCompositeCodec(
                      getUnitCodec(),
                      getData,
                      () => ({ path: nodePath, value: { __kind } }) satisfies Unranged<DecodedEnumVariantTypeNode>,
                  );

            // Within an enum, i.e. when the parent enum is on the stack, the variant also
            // encodes its discriminator as a prefix and decodes it as `__discriminator`.
            const parent = nodePath[nodePath.length - 2];
            if (!isNode(parent, 'enumTypeNode')) return codec;
            const index = (parent.variants ?? []).findIndex(variant => variant.identifier === node.identifier);
            if (index < 0 && node.discriminator === undefined) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
                    message: `Enum variant [${__kind}] is not a variant of its parent enum.`,
                });
            }
            // An omitted discriminator is the variant's position, not the previous discriminator plus one.
            const __discriminator = node.discriminator ?? index;
            const prefix = getConstantCodec((visitValueCodec(parent.size) as NumberCodec).encode(__discriminator));
            return transformCodec(
                getHiddenPrefixCodec(codec, [prefix]),
                (input: DecodedNodeInput) => input,
                (decoded): DecodedEnumVariantTypeNode => {
                    const variant = decoded as DecodedEnumVariantTypeNode;
                    return { ...variant, value: { __discriminator, ...variant.value } };
                },
            );
        },
        visitEvent(node) {
            const path = stack.getPath('eventNode');
            return getCompositeCodec(
                visit(node.data, this),
                value => ({ value }),
                decoded => {
                    const data = decoded as DecodedTypeNode;
                    return { data, path, value: data.value } satisfies Unranged<DecodedEventNode>;
                },
            );
        },
        visitFixedPointType(node) {
            return getLeafCodec(visitValueCodec(node.number));
        },
        visitFloatType(node) {
            const codec = getFloatCodec(node) as Codec<unknown>;
            return getLeafCodec(
                assertValueType(codec, stack.getPath(), 'number | bigint', value =>
                    ['bigint', 'number'].includes(typeof value),
                ),
            );
        },
        visitInstruction(node) {
            if (!node.data) return getLeafCodec(getUnitCodec() as Codec<unknown>);
            const path = stack.getPath('instructionNode');
            return getCompositeCodec(
                visit(node.data, this),
                value => ({ value }),
                decoded => {
                    const data = decoded as DecodedTypeNode;
                    return { data, path, value: data.value } satisfies Unranged<DecodedInstructionNode>;
                },
            );
        },
        visitInstructionLink(node) {
            return visitLinkedNode(node);
        },
        visitIntegerType(node) {
            const codec = getIntegerCodec(node) as Codec<unknown>;
            return getLeafCodec(assertValueType(codec, stack.getPath(), 'integer (number | bigint)', isInteger));
        },
        visitMapType(node) {
            const nodePath = stack.getPath('mapTypeNode');
            const entry = getTupleCodec([visit(node.key, this), visit(node.value, this)]);
            // Maps are represented as objects in order to be compatible with JSON.
            return getCompositeCodec(
                getCollectionCodec(entry, node.count),
                value => {
                    if (!isObjectRecord(value)) throw getUnexpectedValueTypeError(nodePath, 'object', value);
                    return Object.entries(value).map(
                        ([key, entryValue]) => [{ value: key }, { value: entryValue }] as const,
                    );
                },
                decodedEntries => {
                    const entries = decodedEntries as (readonly [DecodedTypeNode, DecodedTypeNode])[];
                    const value = Object.fromEntries(
                        entries.map(([key, entryValue]) => [key.value as PropertyKey, entryValue.value]),
                    );
                    return { entries, path: nodePath, value } satisfies Unranged<DecodedMapTypeNode>;
                },
            );
        },
        visitOptionType(node) {
            const path = stack.getPath('optionTypeNode');
            const fromItem = (item: DecodedTypeNode | undefined, value: Option<unknown>) =>
                ({ ...(item ? { item } : {}), path, value }) satisfies Unranged<DecodedOptionTypeNode>;
            const item = visit(node.item, this);
            const prefix = visitValueCodec(node.prefix) as NumberCodec;
            if (node.fixed) {
                assertIsFixedSize(item);
                return getOptionLikeCodec(getOptionCodec(item, { noneValue: 'zeroes', prefix }), fromItem);
            }
            return getOptionLikeCodec(getOptionCodec(item, { prefix }), fromItem);
        },
        visitPublicKeyType() {
            const codec = fixCodecSize(getBase58Codec(), 32) as Codec<unknown>;
            return getLeafCodec(
                assertValueType(
                    codec,
                    stack.getPath(),
                    'Address',
                    value => typeof value === 'string' && isAddress(value),
                ),
            );
        },
        visitRemainderOptionType(node) {
            const path = stack.getPath('remainderOptionTypeNode');
            return getOptionLikeCodec(
                getOptionCodec(visit(node.item, this), { prefix: null }),
                (item, value) =>
                    ({ ...(item ? { item } : {}), path, value }) satisfies Unranged<DecodedRemainderOptionTypeNode>,
            );
        },
        visitSetType(node) {
            // Sets are represented as arrays in order to be compatible with JSON.
            const item = visit(node.item, this);
            const path = stack.getPath('setTypeNode');
            return getArrayLikeCodec(
                item,
                node.count,
                (items, value) => ({ items, path, value }) satisfies Unranged<DecodedSetTypeNode>,
                items => assertUniqueItems(items, getValueCodec(item), path),
            );
        },
        visitStringType(node) {
            const codec = getCodecFromBytesEncoding(node.encoding) as Codec<unknown>;
            return getLeafCodec(assertValueType(codec, stack.getPath(), 'string', value => typeof value === 'string'));
        },
        visitStructFieldType(node) {
            const path = stack.getPath('structFieldTypeNode');
            const getDefaultValue = node.defaultValue ? getDefaultValueGetter(node.defaultValue) : undefined;
            const omitted = node.defaultValueStrategy === 'omitted';
            return getCompositeCodec(
                visit(node.type, this),
                // Omitted fields always encode their default value, and other fields encode it
                // when missing, i.e. when their value is `undefined`.
                value => ({ value: getDefaultValue && (omitted || value === undefined) ? getDefaultValue() : value }),
                decoded => {
                    const type = decoded as DecodedTypeNode;
                    return { path, type, value: type.value } satisfies Unranged<DecodedStructFieldTypeNode>;
                },
            );
        },
        visitStructType(node) {
            const nodePath = stack.getPath('structTypeNode');
            const fields = (node.fields ?? []).map(field => [field.identifier, visit(field, this)] as const);
            return getCompositeCodec(
                getStructCodec(fields),
                value => {
                    // A missing struct encodes all its fields as missing, so their default values apply.
                    const struct = value === undefined ? {} : value;
                    if (!isObjectRecord(struct)) throw getUnexpectedValueTypeError(nodePath, 'object', struct);
                    return Object.fromEntries(
                        fields.map(([identifier]) => [identifier, { value: struct[identifier] }]),
                    );
                },
                decodedFields => {
                    const decoded = fields.map(
                        ([identifier]) => decodedFields[identifier] as DecodedStructFieldTypeNode,
                    );
                    const value = Object.fromEntries(decoded.map((field, index) => [fields[index][0], field.value]));
                    return { fields: decoded, path: nodePath, value } satisfies Unranged<DecodedStructTypeNode>;
                },
            );
        },
        visitTupleType(node) {
            const nodePath = stack.getPath('tupleTypeNode');
            return getCompositeCodec(
                getTupleCodec((node.items ?? []).map(item => visit(item, this))),
                value => {
                    if (!Array.isArray(value)) throw getUnexpectedValueTypeError(nodePath, 'array', value);
                    return value.map((itemValue: unknown) => ({ value: itemValue }));
                },
                decodedItems => {
                    const items = decodedItems as DecodedTypeNode[];
                    const value = items.map(decoded => decoded.value);
                    return { items, path: nodePath, value } satisfies Unranged<DecodedTupleTypeNode>;
                },
            );
        },
        visitZeroableOptionType(node) {
            const path = stack.getPath('zeroableOptionTypeNode');
            const fromItem = (item: DecodedTypeNode | undefined, value: Option<unknown>) =>
                ({ ...(item ? { item } : {}), path, value }) satisfies Unranged<DecodedZeroableOptionTypeNode>;
            const item = visit(node.item, this);
            assertIsFixedSize(item);
            if (node.zeroValue) {
                const noneValue = getConstantBytes(node.zeroValue);
                return getOptionLikeCodec(getOptionCodec(item, { noneValue, prefix: null }), fromItem);
            }
            return getOptionLikeCodec(getOptionCodec(item, { noneValue: 'zeroes', prefix: null }), fromItem);
        },
    };

    const visitor: Visitor<DecodedNodeCodec, EncodableNodes['kind']> = pipe(
        baseVisitor,
        // Layer each type node's transforms, innermost first, on top of its own codec.
        // For link nodes, they apply on top of the linked type's own transforms. Then
        // record the cursor positions around the node, transforms included.
        v =>
            interceptVisitor(v, (node, next) => {
                const codec = next(node);
                if (!isNode(node, TYPE_NODE_KINDS)) return withRange(codec);
                return withRange((node.transforms ?? []).reduce(applyTransform, codec));
            }),
        v => recordProvidedScopeVisitor(v, scope),
        v => recordNodeStackVisitor(v, stack),
    );
    return visitor;
}

/** Encode a constant value node using its own type, e.g. to get the bytes of a sentinel. */
export function getConstantValueBytes(
    node: ConstantValueNode,
    codecVisitor: Visitor<Codec<unknown>, EncodableNodes['kind']>,
    valueVisitor: Visitor<unknown, ValueNode['kind']>,
): ReadonlyUint8Array {
    return visit(node.type, codecVisitor).encode(visit(node.value, valueVisitor));
}

function getCodecFromBytesEncoding(encoding: BytesEncoding) {
    switch (encoding) {
        case 'base16':
            return getBase16Codec();
        case 'base58':
            return getBase58Codec();
        case 'base64':
            return getBase64Codec();
        case 'utf8':
            return getUtf8Codec();
        default:
            throw new CodamaError(CODAMA_ERROR__UNRECOGNIZED_BYTES_ENCODING, {
                encoding: encoding satisfies never,
            });
    }
}

/** Integers always decode as `bigint`s, whatever their size, and encode from `number`s or `bigint`s. */
function getIntegerCodec(node: IntegerTypeNode): Codec<bigint | number, bigint> {
    const config = { endian: node.endian === 'be' ? Endian.Big : Endian.Little };
    const toBigInt = (codec: Codec<bigint | number, number>) =>
        transformCodec(
            codec,
            (value: bigint | number) => value,
            value => BigInt(value),
        );
    switch (node.format) {
        case 'u8':
            return toBigInt(getU8Codec());
        case 'u16':
            return toBigInt(getU16Codec(config));
        case 'u32':
            return toBigInt(getU32Codec(config));
        case 'u64':
            return getU64Codec(config);
        case 'u128':
            return getU128Codec(config);
        case 'i8':
            return toBigInt(getI8Codec());
        case 'i16':
            return toBigInt(getI16Codec(config));
        case 'i32':
            return toBigInt(getI32Codec(config));
        case 'i64':
            return getI64Codec(config);
        case 'i128':
            return getI128Codec(config);
        case 'shortU16':
            return toBigInt(getShortU16Codec());
        default:
            throw new CodamaError(CODAMA_ERROR__UNRECOGNIZED_NUMBER_FORMAT, {
                format: node.format satisfies never,
            });
    }
}

function getFloatCodec(node: FloatTypeNode): Codec<bigint | number, number> {
    const config = { endian: node.endian === 'be' ? Endian.Big : Endian.Little };
    switch (node.format) {
        case 'f32':
            return getF32Codec(config);
        case 'f64':
            return getF64Codec(config);
        default:
            throw new CodamaError(CODAMA_ERROR__UNRECOGNIZED_NUMBER_FORMAT, {
                format: node.format satisfies never,
            });
    }
}

/** Replace the `read` function of a codec, keeping its size and `write` function. */
function mapCodecRead<TFrom, TTo extends TFrom>(
    codec: Codec<TFrom, TTo>,
    mapRead: (read: Codec<TFrom, TTo>['read']) => Codec<TFrom, TTo>['read'],
): Codec<TFrom, TTo> {
    const read = mapRead(codec.read);
    if (isFixedSize(codec)) return createCodec({ fixedSize: codec.fixedSize, read, write: codec.write });
    return createCodec({
        getSizeFromValue: codec.getSizeFromValue,
        ...(codec.maxSize === undefined ? {} : { maxSize: codec.maxSize }),
        read,
        write: codec.write,
    });
}
