import {
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

/**
 * Get a codec for the node at the end of the given path. Values are raw JavaScript
 * values, e.g. integers are `bigint`s and enums are `{ __kind, __discriminator, data }`.
 *
 * The full path, from the root node, is needed to resolve link nodes and injected
 * values, e.g. `[root, program, definedType]`.
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

    const visitLinkedNode = <TLinkNode extends AccountLinkNode | DefinedTypeLinkNode | InstructionLinkNode>(
        node: TLinkNode,
    ) => {
        const path = linkables.getPathOrThrow(stack.getPath(node.kind) as NodePath<TLinkNode>);
        return stack.visitPath(path, visitor);
    };

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
            return getCollectionCodec(visit(node.item, this), node.count) as Codec<unknown>;
        },
        visitBooleanType(node) {
            const size = visit(node.size, this) as FixedSizeNumberCodec;
            return getBooleanCodec({ size }) as Codec<unknown>;
        },
        visitBytesType() {
            // Bytes are represented as `[encoding, data]` tuples, e.g. `["base64", "SGVsbG8="]`,
            // rather than `Uint8Arrays` in order to be compatible with JSON.
            return createCodec<[BytesEncoding, string]>({
                getSizeFromValue: ([encoding, value]) => {
                    return getCodecFromBytesEncoding(encoding).getSizeFromValue(value);
                },
                read: (bytes, offset) => {
                    const [value, newOffset] = getCodecFromBytesEncoding(bytesEncoding).read(bytes, offset);
                    return [[bytesEncoding, value], newOffset];
                },
                write: ([encoding, value], bytes, offset) => {
                    return getCodecFromBytesEncoding(encoding).write(value, bytes, offset);
                },
            }) as Codec<unknown>;
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
            // An omitted discriminator is the variant's position, not the previous discriminator plus one.
            const discriminators = variants.map((variant, index) => variant.discriminator ?? index);
            const variantCodecs = variants.map((variant, index) => {
                const __kind = variant.identifier;
                const __discriminator = discriminators[index];
                const prefix = getConstantCodec(size.encode(__discriminator));
                const codec = getHiddenPrefixCodec(visit(variant, this), [prefix]);
                if (variant.data === undefined) {
                    return transformCodec(
                        codec,
                        (_: EnumVariantValue) => undefined,
                        (): EnumVariantValue => ({ __discriminator, __kind }),
                    );
                }
                return transformCodec(
                    codec,
                    (value: EnumVariantValue) => value.data,
                    (data): EnumVariantValue => ({ __discriminator, __kind, data }),
                );
            });
            return getUnionCodec(
                variantCodecs,
                value => variants.findIndex(variant => variant.identifier === value.__kind),
                (bytes, offset) => discriminators.indexOf(Number(size.read(bytes, offset)[0])),
            ) as Codec<unknown>;
        },
        visitEnumVariantType(node) {
            return node.data ? visit(node.data, this) : (getUnitCodec() as Codec<unknown>);
        },
        visitEvent(node) {
            return visit(node.data, this);
        },
        visitFixedPointType(node) {
            return visit(node.number, this);
        },
        visitFloatType(node) {
            return getFloatCodec(node) as Codec<unknown>;
        },
        visitInstruction(node) {
            return node.data ? visit(node.data, this) : (getUnitCodec() as Codec<unknown>);
        },
        visitInstructionLink(node) {
            return visitLinkedNode(node);
        },
        visitIntegerType(node) {
            return getIntegerCodec(node) as Codec<unknown>;
        },
        visitMapType(node) {
            const entry = getTupleCodec([visit(node.key, this), visit(node.value, this)]);
            // Maps are represented as objects in order to be compatible with JSON.
            return transformCodec(
                getCollectionCodec(entry as Codec<unknown>, node.count),
                (value: object) => Object.entries(value),
                entries => Object.fromEntries(entries as [PropertyKey, unknown][]),
            ) as Codec<unknown>;
        },
        visitOptionType(node) {
            const item = visit(node.item, this);
            const prefix = visit(node.prefix, this) as NumberCodec;
            if (node.fixed) {
                assertIsFixedSize(item);
                return getOptionCodec(item, { noneValue: 'zeroes', prefix }) as Codec<unknown>;
            }
            return getOptionCodec(item, { prefix }) as Codec<unknown>;
        },
        visitPublicKeyType() {
            return fixCodecSize(getBase58Codec(), 32) as Codec<unknown>;
        },
        visitRemainderOptionType(node) {
            return getOptionCodec(visit(node.item, this), { prefix: null }) as Codec<unknown>;
        },
        visitSetType(node) {
            // Sets are represented as arrays in order to be compatible with JSON.
            return getCollectionCodec(visit(node.item, this), node.count) as Codec<unknown>;
        },
        visitStringType(node) {
            return getCodecFromBytesEncoding(node.encoding) as Codec<unknown>;
        },
        visitStructFieldType(node) {
            return visit(node.type, this);
        },
        visitStructType(node) {
            const fields = (node.fields ?? []).map(field => [field.identifier, visit(field, this)] as const);
            return getStructCodec(fields) as Codec<unknown>;
        },
        visitTupleType(node) {
            return getTupleCodec((node.items ?? []).map(item => visit(item, this))) as Codec<unknown>;
        },
        visitZeroableOptionType(node) {
            const item = visit(node.item, this);
            assertIsFixedSize(item);
            if (node.zeroValue) {
                const noneValue = getConstantBytes(node.zeroValue);
                return getOptionCodec(item, { noneValue, prefix: null }) as Codec<unknown>;
            }
            return getOptionCodec(item, { noneValue: 'zeroes', prefix: null }) as Codec<unknown>;
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
