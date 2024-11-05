import {
    CODAMA_ERROR__UNRECOGNIZED_BYTES_ENCODING,
    CODAMA_ERROR__UNRECOGNIZED_NUMBER_FORMAT,
    CodamaError,
} from '@codama/errors';
import {
    AccountLinkNode,
    AccountNode,
    BytesEncoding,
    CountNode,
    DefinedTypeLinkNode,
    DefinedTypeNode,
    InstructionArgumentLinkNode,
    InstructionArgumentNode,
    InstructionLinkNode,
    InstructionNode,
    isNode,
    isScalarEnum,
    NumberFormat,
    pascalCase,
    RegisteredTypeNode,
    structFieldTypeNode,
    structFieldTypeNodeFromInstructionArgumentNode,
    structTypeNode,
    structTypeNodeFromInstructionArgumentNodes,
} from '@codama/nodes';
import {
    getLastNodeFromPath,
    getRecordLinkablesVisitor,
    LinkableDictionary,
    NodePath,
    NodeStack,
    pipe,
    recordNodeStackVisitor,
    visit,
    Visitor,
} from '@codama/visitors-core';
import {
    addCodecSentinel,
    addCodecSizePrefix,
    assertIsFixedSize,
    Codec,
    createCodec,
    fixCodecSize,
    getArrayCodec,
    getBase16Codec,
    getBase58Codec,
    getBase64Codec,
    getBooleanCodec,
    getConstantCodec,
    getDiscriminatedUnionCodec,
    getEnumCodec,
    getF32Codec,
    getF64Codec,
    getHiddenPrefixCodec,
    getHiddenSuffixCodec,
    getI8Codec,
    getI16Codec,
    getI32Codec,
    getI64Codec,
    getI128Codec,
    getMapCodec,
    getOptionCodec,
    getShortU16Codec,
    getStructCodec,
    getTupleCodec,
    getU8Codec,
    getU16Codec,
    getU32Codec,
    getU64Codec,
    getU128Codec,
    getUnitCodec,
    getUtf8Codec,
    NumberCodec,
    offsetCodec,
    padLeftCodec,
    padRightCodec,
    transformCodec,
} from '@solana/codecs';

import { getValueNodeVisitor } from './values';

export type EncodableNodes =
    | AccountLinkNode
    | AccountNode
    | DefinedTypeLinkNode
    | DefinedTypeNode
    | InstructionArgumentLinkNode
    | InstructionArgumentNode
    | InstructionLinkNode
    | InstructionNode
    | RegisteredTypeNode;

export type CodecVisitorOptions = {
    bytesEncoding?: BytesEncoding;
};

export function getNodeCodec(path: NodePath<EncodableNodes>, options: CodecVisitorOptions = {}): Codec<unknown> {
    const linkables = new LinkableDictionary();
    visit(path[0], getRecordLinkablesVisitor(linkables));

    return visit(
        getLastNodeFromPath(path),
        getNodeCodecVisitor(linkables, {
            stack: new NodeStack(path.slice(0, -1)),
            ...options,
        }),
    );
}

export function getNodeCodecVisitor(
    linkables: LinkableDictionary,
    options: CodecVisitorOptions & { stack?: NodeStack } = {},
): Visitor<Codec<unknown>, EncodableNodes['kind']> {
    const stack = options.stack ?? new NodeStack();
    const bytesEncoding = options.bytesEncoding ?? 'base64';
    const valueNodeVisitor = getValueNodeVisitor(linkables, {
        codecVisitorFactory: () => visitor,
        stack,
    });

    const baseVisitor: Visitor<Codec<unknown>, EncodableNodes['kind']> = {
        visitAccount(node) {
            return visit(node.data, this);
        },
        visitAccountLink(node) {
            const path = linkables.getPathOrThrow(stack.getPath(node.kind));
            stack.pushPath(path);
            const result = visit(getLastNodeFromPath(path), this);
            stack.popPath();
            return result;
        },
        visitAmountType(node) {
            return visit(node.number, this);
        },
        visitArrayType(node) {
            const item = visit(node.item, this);
            const size = getSizeFromCountNode(node.count, this);
            return getArrayCodec(item, { size }) as Codec<unknown>;
        },
        visitBooleanType(node) {
            const size = visit(node.size, this) as NumberCodec;
            return getBooleanCodec({ size }) as Codec<unknown>;
        },
        visitBytesType() {
            // Note we use a format like `["base64", "someData"]` to encode bytes,
            // instead of using `Uint8Arrays` in order to be compatible with JSON.
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
            const path = linkables.getPathOrThrow(stack.getPath(node.kind));
            stack.pushPath(path);
            const result = visit(getLastNodeFromPath(path), this);
            stack.popPath();
            return result;
        },
        visitEnumEmptyVariantType() {
            return getUnitCodec() as Codec<unknown>;
        },
        visitEnumStructVariantType(node) {
            return visit(node.struct, this);
        },
        visitEnumTupleVariantType(node) {
            const tupleAsStruct = structTypeNode([structFieldTypeNode({ name: 'fields', type: node.tuple })]);
            return visit(tupleAsStruct, this);
        },
        visitEnumType(node) {
            const size = visit(node.size, this) as NumberCodec;
            // Scalar enums are decoded as simple numbers.
            if (isScalarEnum(node)) {
                return getEnumCodec(
                    Object.fromEntries(
                        node.variants.flatMap((variant, index) => [
                            [variant.name, index],
                            [index, variant.name],
                        ]),
                    ),
                    { size },
                ) as Codec<unknown>;
            }
            // Data enums are decoded as discriminated unions, e.g. `{ __kind: 'Move', x: 10, y: 20 }`.
            const variants = node.variants.map(variant => [pascalCase(variant.name), visit(variant, this)] as const);
            return getDiscriminatedUnionCodec(variants, { size }) as unknown as Codec<unknown>;
        },
        visitFixedSizeType(node) {
            const type = visit(node.type, this);
            return fixCodecSize(type, node.size);
        },
        visitHiddenPrefixType(node) {
            const type = visit(node.type, this);
            const constants = node.prefix.map(constant => {
                const constantCodec = visit(constant.type, this);
                const constantValue = visit(constant.value, valueNodeVisitor);
                return getConstantCodec(constantCodec.encode(constantValue));
            });
            return getHiddenPrefixCodec(type, constants);
        },
        visitHiddenSuffixType(node) {
            const type = visit(node.type, this);
            const constants = node.suffix.map(constant => {
                const constantCodec = visit(constant.type, this);
                const constantValue = visit(constant.value, valueNodeVisitor);
                return getConstantCodec(constantCodec.encode(constantValue));
            });
            return getHiddenSuffixCodec(type, constants);
        },
        visitInstruction(node) {
            return visit(structTypeNodeFromInstructionArgumentNodes(node.arguments), this);
        },
        visitInstructionArgument(node) {
            return visit(structFieldTypeNodeFromInstructionArgumentNode(node), this);
        },
        visitInstructionArgumentLink(node) {
            const path = linkables.getPathOrThrow(stack.getPath(node.kind));
            stack.pushPath(path);
            const result = visit(getLastNodeFromPath(path), this);
            stack.popPath();
            return result;
        },
        visitInstructionLink(node) {
            const path = linkables.getPathOrThrow(stack.getPath(node.kind));
            stack.pushPath(path);
            const result = visit(getLastNodeFromPath(path), this);
            stack.popPath();
            return result;
        },
        visitMapType(node) {
            const key = visit(node.key, this);
            const value = visit(node.value, this);
            const size = getSizeFromCountNode(node.count, this);
            // Note we transform maps as objects to be compatible with JSON.
            return transformCodec(
                getMapCodec(key, value, { size }),
                (value: object) => new Map(Object.entries(value)),
                (map: Map<unknown, unknown>): object => Object.fromEntries(map),
            ) as Codec<unknown>;
        },
        visitNumberType(node) {
            return getCodecFromNumberFormat(node.format) as Codec<unknown>;
        },
        visitOptionType(node) {
            const item = visit(node.item, this);
            const prefix = visit(node.prefix, this) as NumberCodec;
            if (node.fixed) {
                assertIsFixedSize(item);
                return getOptionCodec(item, { noneValue: 'zeroes', prefix });
            }
            return getOptionCodec(item, { prefix });
        },
        visitPostOffsetType(node) {
            const type = visit(node.type, this);
            switch (node.strategy) {
                case 'padded':
                    return padRightCodec(type, node.offset);
                case 'absolute':
                    return offsetCodec(type, {
                        postOffset: ({ wrapBytes }) => (node.offset < 0 ? wrapBytes(node.offset) : node.offset),
                    });
                case 'preOffset':
                    return offsetCodec(type, { postOffset: ({ preOffset }) => preOffset + node.offset });
                case 'relative':
                default:
                    return offsetCodec(type, { postOffset: ({ postOffset }) => postOffset + node.offset });
            }
        },
        visitPreOffsetType(node) {
            const type = visit(node.type, this);
            switch (node.strategy) {
                case 'padded':
                    return padLeftCodec(type, node.offset);
                case 'absolute':
                    return offsetCodec(type, {
                        preOffset: ({ wrapBytes }) => (node.offset < 0 ? wrapBytes(node.offset) : node.offset),
                    });
                case 'relative':
                default:
                    return offsetCodec(type, { preOffset: ({ preOffset }) => preOffset + node.offset });
            }
        },
        visitPublicKeyType() {
            return fixCodecSize(getBase58Codec(), 32) as Codec<unknown>;
        },
        visitRemainderOptionType(node) {
            const item = visit(node.item, this);
            return getOptionCodec(item, { prefix: null });
        },
        visitSentinelType(node) {
            const type = visit(node.type, this);
            const sentinelCodec = visit(node.sentinel.type, this);
            const sentinelValue = visit(node.sentinel.value, valueNodeVisitor);
            const sentinelBytes = sentinelCodec.encode(sentinelValue);
            return addCodecSentinel(type, sentinelBytes);
        },
        visitSetType(node) {
            const item = visit(node.item, this);
            const size = getSizeFromCountNode(node.count, this);
            // Note we use the array codecs since it is compatible with the JSON format.
            return getArrayCodec(item, { size }) as Codec<unknown>;
        },
        visitSizePrefixType(node) {
            const type = visit(node.type, this);
            const prefix = visit(node.prefix, this) as NumberCodec;
            return addCodecSizePrefix(type, prefix);
        },
        visitSolAmountType(node) {
            return visit(node.number, this);
        },
        visitStringType(node) {
            return getCodecFromBytesEncoding(node.encoding) as Codec<unknown>;
        },
        visitStructFieldType(node) {
            return visit(node.type, this);
        },
        visitStructType(node) {
            const fields = node.fields.map(field => [field.name, visit(field, this)] as const);
            return getStructCodec(fields) as Codec<unknown>;
        },
        visitTupleType(node) {
            const items = node.items.map(item => visit(item, this));
            return getTupleCodec(items) as Codec<unknown>;
        },
        visitZeroableOptionType(node) {
            const item = visit(node.item, this);
            assertIsFixedSize(item);
            if (node.zeroValue) {
                const noneCodec = visit(node.zeroValue.type, this);
                const noneValue = visit(node.zeroValue.value, valueNodeVisitor);
                const noneBytes = noneCodec.encode(noneValue);
                return getOptionCodec(item, { noneValue: noneBytes, prefix: null });
            }
            return getOptionCodec(item, { noneValue: 'zeroes', prefix: null });
        },
    };

    const visitor = pipe(baseVisitor, v => recordNodeStackVisitor(v, stack));
    return visitor;
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

function getCodecFromNumberFormat(format: NumberFormat) {
    switch (format) {
        case 'u8':
            return getU8Codec();
        case 'u16':
            return getU16Codec();
        case 'u32':
            return getU32Codec();
        case 'u64':
            return getU64Codec();
        case 'u128':
            return getU128Codec();
        case 'i8':
            return getI8Codec();
        case 'i16':
            return getI16Codec();
        case 'i32':
            return getI32Codec();
        case 'i64':
            return getI64Codec();
        case 'i128':
            return getI128Codec();
        case 'f32':
            return getF32Codec();
        case 'f64':
            return getF64Codec();
        case 'shortU16':
            return getShortU16Codec();
        default:
            throw new CodamaError(CODAMA_ERROR__UNRECOGNIZED_NUMBER_FORMAT, {
                format: format satisfies never,
            });
    }
}

function getSizeFromCountNode(
    node: CountNode,
    visitor: Visitor<unknown, EncodableNodes['kind']>,
): NumberCodec | number | 'remainder' {
    if (isNode(node, 'prefixedCountNode')) {
        return visit(node.prefix, visitor) as NumberCodec;
    }
    if (isNode(node, 'fixedCountNode')) {
        return node.value;
    }
    return 'remainder';
}
