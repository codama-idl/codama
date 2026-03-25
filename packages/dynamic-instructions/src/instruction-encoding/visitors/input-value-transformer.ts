import type { BytesEncoding, RootNode, TypeNode, Visitor } from 'codama';
import { isNode, pascalCase, visitOrElse } from 'codama';

import { isUint8Array, uint8ArrayToEncodedString } from '../../shared/bytes-encoding';
import { ArgumentError } from '../../shared/errors';
import { formatValueType, isObjectRecord, safeStringify } from '../../shared/util';

/**
 * Type nodes that the input value transformer can process.
 * Includes all StandaloneTypeNode kinds plus definedTypeLinkNode.
 */
export type TransformableTypeNodeKind =
    | 'amountTypeNode'
    | 'arrayTypeNode'
    | 'booleanTypeNode'
    | 'bytesTypeNode'
    | 'dateTimeTypeNode'
    | 'definedTypeLinkNode'
    | 'enumTypeNode'
    | 'fixedSizeTypeNode'
    | 'hiddenPrefixTypeNode'
    | 'hiddenSuffixTypeNode'
    | 'mapTypeNode'
    | 'numberTypeNode'
    | 'optionTypeNode'
    | 'postOffsetTypeNode'
    | 'preOffsetTypeNode'
    | 'publicKeyTypeNode'
    | 'remainderOptionTypeNode'
    | 'sentinelTypeNode'
    | 'setTypeNode'
    | 'sizePrefixTypeNode'
    | 'solAmountTypeNode'
    | 'stringTypeNode'
    | 'structFieldTypeNode'
    | 'structTypeNode'
    | 'tupleTypeNode'
    | 'zeroableOptionTypeNode';

export type InputValueTransformerOptions = {
    bytesEncoding?: BytesEncoding;
};

/**
 * A transformer function that converts user input to Codama codec-compatible format.
 */
export type InputTransformer = (input: unknown) => unknown;

/**
 * Creates a visitor that returns transformer functions for each type node kind.
 * Returns transformer function to convert user input to the format expected by @codama/dynamic-codecs.
 */
export function createInputValueTransformerVisitor(
    root: RootNode,
    options: InputValueTransformerOptions = {},
): Visitor<InputTransformer, TransformableTypeNodeKind> {
    const bytesEncoding = options.bytesEncoding ?? 'base16';

    const visitor: Visitor<InputTransformer, TransformableTypeNodeKind> = {
        visitAmountType(node) {
            return visitOrElse(node.number, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in amountTypeNode: ${innerNode.kind}`);
            });
        },

        visitArrayType(node) {
            const itemTransform = visitOrElse(node.item, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in arrayTypeNode: ${innerNode.kind}`);
            });
            return (input: unknown) => {
                if (!Array.isArray(input)) {
                    throw new ArgumentError(
                        `Expected an array for arrayTypeNode, but received: ${formatValueType(input)}. ` +
                            `Received value: ${safeStringify(input)}`,
                    );
                }
                return input.map(itemTransform);
            };
        },

        visitBooleanType() {
            return (input: unknown) => input;
        },

        visitBytesType() {
            return (input: unknown) => {
                if (isUint8Array(input)) {
                    return [bytesEncoding, uint8ArrayToEncodedString(input, bytesEncoding)];
                }
                // Accept number[] by coercing to Uint8Array.
                if (Array.isArray(input) && input.every(item => typeof item === 'number')) {
                    return [bytesEncoding, uint8ArrayToEncodedString(new Uint8Array(input), bytesEncoding)];
                }
                throw new ArgumentError(
                    `Expected bytes input (Uint8Array or number[]) for bytesTypeNode, but received: ${formatValueType(input)}. ` +
                        `Received value: ${safeStringify(input)}`,
                );
            };
        },

        visitDateTimeType(node) {
            return visitOrElse(node.number, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in dateTimeTypeNode: ${innerNode.kind}`);
            });
        },

        visitDefinedTypeLink(node) {
            const definedType = root.program.definedTypes.find(dt => dt.name === node.name);
            if (!definedType) {
                throw new ArgumentError(`Cannot resolve defined type link: ${node.name}`);
            }
            return visitOrElse(definedType.type, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in definedTypeLink: ${innerNode.kind}`);
            });
        },

        visitEnumType(node) {
            // Scalar enums pass through (just numbers/strings)
            // Data enums need variant transformation with PascalCase __kind
            // Because @codama/dynamic-codecs applies pascalCase() to variant names when building discriminated union codecs:
            // @see https://github.com/codama-idl/codama/blob/main/packages/dynamic-codecs/src/codecs.ts#L199
            return (input: unknown) => {
                if (typeof input === 'number' || typeof input === 'string') {
                    return input;
                }

                if (!isObjectRecord(input)) {
                    return input;
                }

                if (!('__kind' in input)) {
                    return input;
                }

                const { __kind, ...rest } = input;
                const kindObj = { __kind: pascalCase(String(__kind)) };
                const variantNode = node.variants.find(v => v.name === __kind);

                if (!variantNode) {
                    const availableVariants = node.variants.map(v => v.name).join(', ');
                    throw new ArgumentError(
                        `Unknown enum variant ${safeStringify(__kind)} for enumTypeNode. Available variants: [${availableVariants}]`,
                    );
                }

                if (isNode(variantNode, 'enumEmptyVariantTypeNode')) {
                    return { ...input, ...kindObj };
                }

                if (isNode(variantNode, 'enumStructVariantTypeNode')) {
                    const structTransform = visitOrElse(variantNode.struct, visitor, innerNode => {
                        throw new ArgumentError(
                            `Unsupported type node in enumStructVariantTypeNode: ${innerNode.kind}`,
                        );
                    });
                    const transformedFields = structTransform(rest);
                    if (!isObjectRecord(transformedFields)) {
                        throw new ArgumentError(
                            `Expected transformed fields to be an object for enumStructVariantTypeNode, got: ${formatValueType(transformedFields)}`,
                        );
                    }
                    return { ...kindObj, ...transformedFields };
                }

                if (isNode(variantNode, 'enumTupleVariantTypeNode')) {
                    const tupleTransform = visitOrElse(variantNode.tuple, visitor, innerNode => {
                        throw new ArgumentError(`Unsupported type node in enumTupleVariantTypeNode: ${innerNode.kind}`);
                    });
                    if (!('fields' in rest) || !Array.isArray(rest.fields)) {
                        throw new ArgumentError(
                            `Expected "fields" array for enum tuple variant ${safeStringify(__kind)}, ` +
                                `but received: ${formatValueType(rest.fields ?? rest)}. ` +
                                `Received value: ${safeStringify(input)}`,
                        );
                    }
                    return { ...kindObj, fields: tupleTransform(rest.fields) };
                }

                return input;
            };
        },

        visitFixedSizeType(node) {
            return visitOrElse(node.type, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in fixedSizeTypeNode: ${innerNode.kind}`);
            });
        },

        visitHiddenPrefixType(node) {
            return visitOrElse(node.type, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in hiddenPrefixTypeNode: ${innerNode.kind}`);
            });
        },

        visitHiddenSuffixType(node) {
            return visitOrElse(node.type, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in hiddenSuffixTypeNode: ${innerNode.kind}`);
            });
        },

        visitMapType(node) {
            // Maps are represented as objects in dynamic-codecs
            const valueTransform = visitOrElse(node.value, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in mapTypeNode value: ${innerNode.kind}`);
            });
            return (input: unknown) => {
                if (!isObjectRecord(input)) {
                    throw new ArgumentError(
                        `Expected a plain object for mapTypeNode, but received: ${formatValueType(input)}. ` +
                            `Received value: ${safeStringify(input)}`,
                    );
                }
                const result: Record<string, unknown> = {};
                for (const [key, value] of Object.entries(input)) {
                    result[key] = valueTransform(value);
                }
                return result;
            };
        },

        // Primitive types (pass through)
        visitNumberType() {
            return (input: unknown) => input;
        },

        visitOptionType(node) {
            const innerTransform = visitOrElse(node.item, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in optionTypeNode: ${innerNode.kind}`);
            });
            return (input: unknown) => {
                if (input === null || input === undefined) return input;
                return innerTransform(input);
            };
        },

        visitPostOffsetType(node) {
            return visitOrElse(node.type, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in postOffsetTypeNode: ${innerNode.kind}`);
            });
        },

        visitPreOffsetType(node) {
            return visitOrElse(node.type, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in preOffsetTypeNode: ${innerNode.kind}`);
            });
        },

        visitPublicKeyType() {
            return (input: unknown) => input;
        },

        visitRemainderOptionType(node) {
            const innerTransform = visitOrElse(node.item, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in remainderOptionTypeNode: ${innerNode.kind}`);
            });
            return (input: unknown) => {
                if (input === null || input === undefined) return input;
                return innerTransform(input);
            };
        },

        visitSentinelType(node) {
            return visitOrElse(node.type, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in sentinelTypeNode: ${innerNode.kind}`);
            });
        },

        visitSetType(node) {
            // Sets are represented as arrays in dynamic-codecs
            const itemTransform = visitOrElse(node.item, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in setTypeNode: ${innerNode.kind}`);
            });
            return (input: unknown) => {
                if (!Array.isArray(input)) {
                    throw new ArgumentError(
                        `Expected an array for setTypeNode, but received: ${formatValueType(input)}. ` +
                            `Received value: ${safeStringify(input)}`,
                    );
                }
                return input.map(itemTransform);
            };
        },

        visitSizePrefixType(node) {
            return visitOrElse(node.type, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in sizePrefixTypeNode: ${innerNode.kind}`);
            });
        },

        visitSolAmountType(node) {
            return visitOrElse(node.number, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in solAmountTypeNode: ${innerNode.kind}`);
            });
        },

        visitStringType() {
            return (input: unknown) => input;
        },

        visitStructFieldType(node) {
            return visitOrElse(node.type, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in structFieldTypeNode: ${innerNode.kind}`);
            });
        },

        visitStructType(node) {
            const fieldTransformers = node.fields.map(field => {
                const transform = visitOrElse(field, visitor, innerNode => {
                    throw new ArgumentError(`Unsupported type node in structTypeNode field: ${innerNode.kind}`);
                });
                return { name: field.name, transform };
            });
            return (input: unknown) => {
                if (!isObjectRecord(input)) {
                    throw new ArgumentError(
                        `Expected a plain object for structTypeNode, but received: ${formatValueType(input)}. ` +
                            `Received value: ${safeStringify(input)}`,
                    );
                }
                const result = { ...input } as Record<string, unknown>;
                for (const { name, transform } of fieldTransformers) {
                    if (name in result) {
                        result[name] = transform(result[name]);
                    }
                }
                return result;
            };
        },

        visitTupleType(node) {
            const itemTransforms = node.items.map(item =>
                visitOrElse(item, visitor, innerNode => {
                    throw new ArgumentError(`Unsupported type node in tupleTypeNode: ${innerNode.kind}`);
                }),
            );
            return (input: unknown) => {
                if (!Array.isArray(input)) {
                    throw new ArgumentError(
                        `Expected an array for tupleTypeNode, but received: ${formatValueType(input)}. ` +
                            `Received value: ${safeStringify(input)}`,
                    );
                }
                if (input.length !== itemTransforms.length) {
                    throw new ArgumentError(
                        `Expected tuple of length ${itemTransforms.length} for tupleTypeNode, but received array of length ${input.length}.`,
                    );
                }
                return input.map((value: unknown, index) => itemTransforms[index](value));
            };
        },

        visitZeroableOptionType(node) {
            const innerTransform = visitOrElse(node.item, visitor, innerNode => {
                throw new ArgumentError(`Unsupported type node in zeroableOptionTypeNode: ${innerNode.kind}`);
            });
            return (input: unknown) => {
                if (input === null || input === undefined) return input;
                return innerTransform(input);
            };
        },
    };

    return visitor;
}

/**
 * Creates a transformer function that converts user input to codec-compatible input format.
 * For example: user input Uint8Array for binary data but @codama/dynamic-codecs expects [BytesEncoding, string] as input
 *
 * @param typeNode - The Codama type node describing the expected structure
 * @param root - Root node for resolving definedTypeLinkNode references
 * @param options - Configuration options (encoding preference)
 * @returns Transformer function that converts input to codec format
 *
 * @example
 * const transformer = createInputValueTransformer(
 *     bytesTypeNode(),
 *     root,
 *     { bytesEncoding: 'base16' }
 * );
 *
 * const input = new Uint8Array([72, 101, 108, 108, 111]);
 * const transformed = transformer(input); // => ['base16', '48656c6c6f']
 * Usage with codec: codamaCodec.encode(['base16', '48656c6c6f'])
 */
export function createInputValueTransformer(
    typeNode: TypeNode,
    root: RootNode,
    options?: InputValueTransformerOptions,
): InputTransformer {
    const visitor = createInputValueTransformerVisitor(root, options);
    return visitOrElse(typeNode, visitor, node => {
        throw new ArgumentError(`Unsupported type node for input transformation: ${node.kind}`);
    });
}
