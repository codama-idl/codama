import {
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
    interceptVisitor,
    LinkableDictionary,
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
    NumberCodec,
    offsetCodec,
    padLeftCodec,
    padRightCodec,
    ReadonlyUint8Array,
    transformCodec,
} from '@solana/codecs';

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

/** Options shared by {@link getNodeValueCodec} and {@link getNodeValueCodecVisitor}. */
export type CodecVisitorOptions = {
    /** The encoding used to decode plain bytes, e.g. `["base64", "SGVsbG8="]`. Defaults to `base64`. */
    bytesEncoding?: BytesEncoding;
};

/** The decoded value of an enum variant, e.g. `{ __kind: 'move', __discriminator: 2, data: { x: 1n } }`. */
type EnumVariantValue = { __discriminator?: number; __kind: string; data?: unknown };

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
 * Get a codec for the node at the end of the given path. Values are raw JavaScript
 * values, e.g. integers are `bigint`s and enums are `{ __kind, __discriminator, data }`.
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
    const linkables = new LinkableDictionary();
    visit(path[0], getRecordLinkablesVisitor(linkables));

    // Open a frame for every enclosing instruction, so the ones `provides` resolve injected values.
    const ancestors = path.slice(0, -1);
    const frames = ancestors.flatMap(node => (isNode(node, 'instructionNode') ? [node.provides ?? []] : []));

    return visit(
        getLastNodeFromPath(path),
        getNodeValueCodecVisitor(linkables, {
            ...options,
            scope: new ProvidedScope(...frames),
            stack: new NodeStack(ancestors),
        }),
    );
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
    const stack = options.stack ?? new NodeStack();
    const scope = options.scope ?? new ProvidedScope();
    const bytesEncoding = options.bytesEncoding ?? 'base64';
    const valueVisitor = getValueNodeVisitor(linkables, { codecVisitorFactory: () => visitor, scope, stack });
    const getConstantBytes = (node: ConstantValueNode) => getConstantValueBytes(node, visitor, valueVisitor);

    // Default values are only evaluated when needed, e.g. an injected default only throws if
    // the input does not provide the field. Since they are evaluated when encoding, by which
    // point the live `stack` and `scope` have unwound, they cannot reuse `valueVisitor`: they
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

    const visitLinkedNode = <TLinkNode extends AccountLinkNode | DefinedTypeLinkNode | InstructionLinkNode>(
        node: TLinkNode,
    ) => {
        const path = linkables.getPathOrThrow(stack.getPath(node.kind) as NodePath<TLinkNode>);
        return stack.visitPath(path, visitor);
    };

    // Arrays and sets are encoded from arrays.
    const getArrayLikeCodec = (item: Codec<unknown>, count: CountNode): Codec<unknown> =>
        assertValueType(getCollectionCodec(item, count) as Codec<unknown>, stack.getPath(), 'array', value =>
            Array.isArray(value),
        );

    // Options encode missing values as `None`, like `null`.
    const encodeMissingAsNone = (codec: Codec<unknown>): Codec<unknown> =>
        transformCodec<unknown, unknown, unknown>(codec, value => (value === undefined ? null : value));

    const getCollectionCodec = (item: Codec<unknown>, count: CountNode): Codec<unknown[]> => {
        switch (count.kind) {
            case 'fixedCountNode':
                return getArrayCodec(item, { size: count.value });
            case 'prefixedCountNode':
                return getArrayCodec(item, { size: visit(count.prefix, visitor) as NumberCodec });
            case 'remainderCountNode':
                return getArrayCodec(item, { size: 'remainder' });
            case 'sentinelCountNode': {
                const sentinel = getConstantBytes(count.sentinel);
                return getArrayCodec(item, { size: { __kind: 'sentinel', sentinel, strategy: count.strategy } });
            }
        }
    };

    const applyTransform = (codec: Codec<unknown>, transform: TransformNode): Codec<unknown> => {
        switch (transform.kind) {
            case 'fixedSizeTransformNode':
                return fixCodecSize(codec, transform.size);
            case 'sizePrefixTransformNode':
                return addCodecSizePrefix(codec, visit(transform.prefix, visitor) as NumberCodec);
            case 'sentinelTransformNode':
                return addCodecSentinel(codec, getConstantBytes(transform.sentinel));
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

    const baseVisitor: Visitor<Codec<unknown>, EncodableNodes['kind']> = {
        visitAccount(node) {
            return visit(node.data, this);
        },
        visitAccountLink(node) {
            return visitLinkedNode(node);
        },
        visitArrayType(node) {
            return getArrayLikeCodec(visit(node.item, this), node.count);
        },
        visitBooleanType(node) {
            const size = visit(node.size, this) as FixedSizeNumberCodec;
            const codec = getBooleanCodec({ size }) as Codec<unknown>;
            return assertValueType(codec, stack.getPath(), 'boolean', value => typeof value === 'boolean');
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
            return assertValueType(codec, stack.getPath(), 'Uint8Array | [BytesEncoding, string]', isBytesValue);
        },
        visitDateTimeType(node) {
            return visit(node.number, this);
        },
        visitDefinedType(node) {
            return visit(node.type, this);
        },
        visitDefinedTypeLink(node) {
            return visitLinkedNode(node);
        },
        visitDurationType(node) {
            return visit(node.number, this);
        },
        visitEnumType(node) {
            const size = visit(node.size, this) as NumberCodec;
            const variants = node.variants ?? [];
            // Each variant codec encodes its own discriminator prefix, see `visitEnumVariantType`.
            const discriminators = variants.map((variant, index) => variant.discriminator ?? index);
            const nodePath = stack.getPath();
            const union = getUnionCodec(
                variants.map(variant => visit(variant, this) as Codec<EnumVariantValue>),
                (value: EnumVariantValue) => {
                    const index = variants.findIndex(variant => variant.identifier === value.__kind);
                    if (index < 0) {
                        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
                            actualType: `variant '${String(value.__kind)}'`,
                            expectedType: `one of [${variants.map(variant => variant.identifier).join(', ')}]`,
                            nodeKind: 'enumTypeNode',
                            nodePath,
                        });
                    }
                    return index;
                },
                (bytes, offset) => discriminators.indexOf(Number(size.read(bytes, offset)[0])),
            );
            // Variants without data may also be encoded from their identifier, e.g. `'frozen'`.
            return transformCodec(union, (value: unknown): EnumVariantValue => {
                if (typeof value === 'string') return { __kind: value };
                if (isObjectRecord(value) && typeof value.__kind === 'string') return value as EnumVariantValue;
                throw getUnexpectedValueTypeError(nodePath, 'string | { __kind: string }', value);
            }) as Codec<unknown>;
        },
        visitEnumVariantType(node) {
            const __kind = node.identifier;
            const nodePath = stack.getPath();
            const payload = node.data ? visit(node.data, this) : (getUnitCodec() as Codec<unknown>);
            const codec = transformCodec(
                payload,
                (value: EnumVariantValue) => {
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
                },
                (data): EnumVariantValue => (node.data === undefined ? { __kind } : { __kind, data }),
            );

            // Within an enum, i.e. when the parent enum is on the stack, the variant also
            // encodes its discriminator as a prefix and decodes it as `__discriminator`.
            const path = stack.getPath();
            const parent = path[path.length - 2];
            if (!isNode(parent, 'enumTypeNode')) return codec as Codec<unknown>;
            const index = (parent.variants ?? []).findIndex(variant => variant.identifier === node.identifier);
            if (index < 0 && node.discriminator === undefined) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
                    message: `Enum variant [${__kind}] is not a variant of its parent enum.`,
                });
            }
            // An omitted discriminator is the variant's position, not the previous discriminator plus one.
            const __discriminator = node.discriminator ?? index;
            const prefix = getConstantCodec((visit(parent.size, this) as NumberCodec).encode(__discriminator));
            return transformCodec(
                getHiddenPrefixCodec(codec, [prefix]),
                (value: EnumVariantValue) => value,
                (value: EnumVariantValue): EnumVariantValue => ({ __discriminator, ...value }),
            ) as Codec<unknown>;
        },
        visitEvent(node) {
            return visit(node.data, this);
        },
        visitFixedPointType(node) {
            return visit(node.number, this);
        },
        visitFloatType(node) {
            const codec = getFloatCodec(node) as Codec<unknown>;
            return assertValueType(codec, stack.getPath(), 'number | bigint', value =>
                ['bigint', 'number'].includes(typeof value),
            );
        },
        visitInstruction(node) {
            return node.data ? visit(node.data, this) : (getUnitCodec() as Codec<unknown>);
        },
        visitInstructionLink(node) {
            return visitLinkedNode(node);
        },
        visitIntegerType(node) {
            const codec = getIntegerCodec(node) as Codec<unknown>;
            return assertValueType(codec, stack.getPath(), 'integer (number | bigint)', isInteger);
        },
        visitMapType(node) {
            const entry = getTupleCodec([visit(node.key, this), visit(node.value, this)]);
            // Maps are represented as objects in order to be compatible with JSON.
            const codec = transformCodec(
                getCollectionCodec(entry as Codec<unknown>, node.count),
                (value: object) => Object.entries(value),
                entries => Object.fromEntries(entries as [PropertyKey, unknown][]),
            ) as Codec<unknown>;
            return assertValueType(codec, stack.getPath(), 'object', isObjectRecord);
        },
        visitOptionType(node) {
            const item = visit(node.item, this);
            const prefix = visit(node.prefix, this) as NumberCodec;
            if (node.fixed) {
                assertIsFixedSize(item);
                return encodeMissingAsNone(getOptionCodec(item, { noneValue: 'zeroes', prefix }) as Codec<unknown>);
            }
            return encodeMissingAsNone(getOptionCodec(item, { prefix }) as Codec<unknown>);
        },
        visitPublicKeyType() {
            const codec = fixCodecSize(getBase58Codec(), 32) as Codec<unknown>;
            return assertValueType(
                codec,
                stack.getPath(),
                'Address',
                value => typeof value === 'string' && isAddress(value),
            );
        },
        visitRemainderOptionType(node) {
            return encodeMissingAsNone(getOptionCodec(visit(node.item, this), { prefix: null }) as Codec<unknown>);
        },
        visitSetType(node) {
            // Sets are represented as arrays in order to be compatible with JSON.
            const item = visit(node.item, this);
            return assertUniqueItems(getArrayLikeCodec(item, node.count), item, stack.getPath());
        },
        visitStringType(node) {
            const codec = getCodecFromBytesEncoding(node.encoding) as Codec<unknown>;
            return assertValueType(codec, stack.getPath(), 'string', value => typeof value === 'string');
        },
        visitStructFieldType(node) {
            const codec = visit(node.type, this);
            if (node.defaultValue === undefined) return codec;
            const getDefaultValue = getDefaultValueGetter(node.defaultValue);
            const omitted = node.defaultValueStrategy === 'omitted';
            // Omitted fields always encode their default value, and other fields encode it
            // when missing, i.e. when their value is `undefined`.
            return transformCodec(codec, (value: unknown) =>
                omitted || value === undefined ? getDefaultValue() : value,
            );
        },
        visitStructType(node) {
            const fields = (node.fields ?? []).map(field => [field.identifier, visit(field, this)] as const);
            const codec = assertValueType(
                getStructCodec(fields) as Codec<unknown>,
                stack.getPath(),
                'object',
                isObjectRecord,
            );
            // A missing struct encodes all its fields as missing, so their default values apply.
            return transformCodec<unknown, unknown, unknown>(codec, value => (value === undefined ? {} : value));
        },
        visitTupleType(node) {
            const codec = getTupleCodec((node.items ?? []).map(item => visit(item, this))) as Codec<unknown>;
            return assertValueType(codec, stack.getPath(), 'array', value => Array.isArray(value));
        },
        visitZeroableOptionType(node) {
            const item = visit(node.item, this);
            assertIsFixedSize(item);
            if (node.zeroValue) {
                const noneValue = getConstantBytes(node.zeroValue);
                return encodeMissingAsNone(getOptionCodec(item, { noneValue, prefix: null }) as Codec<unknown>);
            }
            return encodeMissingAsNone(getOptionCodec(item, { noneValue: 'zeroes', prefix: null }) as Codec<unknown>);
        },
    };

    const visitor: Visitor<Codec<unknown>, EncodableNodes['kind']> = pipe(
        baseVisitor,
        // Layer each type node's transforms, innermost first, on top of its own codec.
        // For link nodes, they apply on top of the linked type's own transforms.
        v =>
            interceptVisitor(v, (node, next) => {
                const codec = next(node);
                if (!isNode(node, TYPE_NODE_KINDS)) return codec;
                return (node.transforms ?? []).reduce(applyTransform, codec);
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
