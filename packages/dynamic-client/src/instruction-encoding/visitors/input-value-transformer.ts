import {
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE,
    CODAMA_ERROR__LINKED_NODE_NOT_FOUND,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CodamaError,
} from '@codama/errors';
import type { BytesEncoding, Node, RootNode, TypeNode, Visitor } from 'codama';
import { isNode, pascalCase, visitOrElse } from 'codama';

import { isUint8Array, uint8ArrayToEncodedString } from '../../shared/bytes-encoding';
import { formatValueType, isObjectRecord } from '../../shared/util';

/**
 * Type nodes that the input value transformer can process.
 * Includes all StandaloneTypeNode kinds plus definedTypeLinkNode.
 */
export const INPUT_VALUE_TRANSFORMER_SUPPORTED_NODE_KINDS = [
    'amountTypeNode',
    'arrayTypeNode',
    'booleanTypeNode',
    'bytesTypeNode',
    'dateTimeTypeNode',
    'definedTypeLinkNode',
    'enumTypeNode',
    'fixedSizeTypeNode',
    'hiddenPrefixTypeNode',
    'hiddenSuffixTypeNode',
    'mapTypeNode',
    'numberTypeNode',
    'optionTypeNode',
    'postOffsetTypeNode',
    'preOffsetTypeNode',
    'publicKeyTypeNode',
    'remainderOptionTypeNode',
    'sentinelTypeNode',
    'setTypeNode',
    'sizePrefixTypeNode',
    'solAmountTypeNode',
    'stringTypeNode',
    'structFieldTypeNode',
    'structTypeNode',
    'tupleTypeNode',
    'zeroableOptionTypeNode',
] as const;

export type TransformableTypeNodeKind = (typeof INPUT_VALUE_TRANSFORMER_SUPPORTED_NODE_KINDS)[number];

export type InputValueTransformerOptions = {
    bytesEncoding?: BytesEncoding;
};

/**
 * A transformer function that converts user input to Codama codec-compatible format.
 */
export type InputTransformer = (input: unknown) => unknown;

function unexpectedNodeFallback(node: Node): never {
    throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
        expectedKinds: [...INPUT_VALUE_TRANSFORMER_SUPPORTED_NODE_KINDS],
        kind: node.kind,
        node,
    });
}

export function createInputValueTransformerVisitor(
    root: RootNode,
    options: InputValueTransformerOptions = {},
): Visitor<InputTransformer, TransformableTypeNodeKind> {
    const bytesEncoding = options.bytesEncoding ?? 'base16';

    const visitor: Visitor<InputTransformer, TransformableTypeNodeKind> = {
        visitAmountType(node) {
            return visitOrElse(node.number, visitor, unexpectedNodeFallback);
        },

        visitArrayType(node) {
            const itemTransform = visitOrElse(node.item, visitor, unexpectedNodeFallback);
            return (input: unknown) => {
                if (!Array.isArray(input)) {
                    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE, {
                        actualType: formatValueType(input),
                        expectedType: 'array',
                        nodeKind: 'arrayTypeNode',
                    });
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
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE, {
                    actualType: formatValueType(input),
                    expectedType: 'Uint8Array | number[]',
                    nodeKind: 'bytesTypeNode',
                });
            };
        },

        visitDateTimeType(node) {
            return visitOrElse(node.number, visitor, unexpectedNodeFallback);
        },

        visitDefinedTypeLink(node) {
            const definedType = root.program.definedTypes.find(dt => dt.name === node.name);
            if (!definedType) {
                throw new CodamaError(CODAMA_ERROR__LINKED_NODE_NOT_FOUND, {
                    kind: 'definedTypeLinkNode',
                    linkNode: node,
                    name: node.name,
                    path: [],
                });
            }
            return visitOrElse(definedType.type, visitor, unexpectedNodeFallback);
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
                    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE, {
                        actualType: `variant '${String(__kind)}'`,
                        expectedType: `one of [${availableVariants}]`,
                        nodeKind: 'enumTypeNode',
                    });
                }

                if (isNode(variantNode, 'enumEmptyVariantTypeNode')) {
                    return { ...input, ...kindObj };
                }

                if (isNode(variantNode, 'enumStructVariantTypeNode')) {
                    const structTransform = visitOrElse(variantNode.struct, visitor, unexpectedNodeFallback);
                    const transformedFields = structTransform(rest);
                    if (!isObjectRecord(transformedFields)) {
                        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE, {
                            actualType: formatValueType(transformedFields),
                            expectedType: 'object',
                            nodeKind: 'enumStructVariantTypeNode',
                        });
                    }
                    return { ...kindObj, ...transformedFields };
                }

                if (isNode(variantNode, 'enumTupleVariantTypeNode')) {
                    const tupleTransform = visitOrElse(variantNode.tuple, visitor, unexpectedNodeFallback);
                    if (!('fields' in rest) || !Array.isArray(rest.fields)) {
                        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE, {
                            actualType: formatValueType(rest.fields ?? rest),
                            expectedType: 'array (fields)',
                            nodeKind: 'enumTupleVariantTypeNode',
                        });
                    }
                    return { ...kindObj, fields: tupleTransform(rest.fields) };
                }

                return input;
            };
        },

        visitFixedSizeType(node) {
            return visitOrElse(node.type, visitor, unexpectedNodeFallback);
        },

        visitHiddenPrefixType(node) {
            return visitOrElse(node.type, visitor, unexpectedNodeFallback);
        },

        visitHiddenSuffixType(node) {
            return visitOrElse(node.type, visitor, unexpectedNodeFallback);
        },

        visitMapType(node) {
            // Maps are represented as objects in dynamic-codecs
            const valueTransform = visitOrElse(node.value, visitor, unexpectedNodeFallback);
            return (input: unknown) => {
                if (!isObjectRecord(input)) {
                    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE, {
                        actualType: formatValueType(input),
                        expectedType: 'object',
                        nodeKind: 'mapTypeNode',
                    });
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
            const innerTransform = visitOrElse(node.item, visitor, unexpectedNodeFallback);
            return (input: unknown) => {
                if (input === null || input === undefined) return input;
                return innerTransform(input);
            };
        },

        visitPostOffsetType(node) {
            return visitOrElse(node.type, visitor, unexpectedNodeFallback);
        },

        visitPreOffsetType(node) {
            return visitOrElse(node.type, visitor, unexpectedNodeFallback);
        },

        visitPublicKeyType() {
            return (input: unknown) => input;
        },

        visitRemainderOptionType(node) {
            const innerTransform = visitOrElse(node.item, visitor, unexpectedNodeFallback);
            return (input: unknown) => {
                if (input === null || input === undefined) return input;
                return innerTransform(input);
            };
        },

        visitSentinelType(node) {
            return visitOrElse(node.type, visitor, unexpectedNodeFallback);
        },

        visitSetType(node) {
            // Sets are represented as arrays in dynamic-codecs
            const itemTransform = visitOrElse(node.item, visitor, unexpectedNodeFallback);
            return (input: unknown) => {
                if (!Array.isArray(input)) {
                    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE, {
                        actualType: formatValueType(input),
                        expectedType: 'array',
                        nodeKind: 'setTypeNode',
                    });
                }
                return input.map(itemTransform);
            };
        },

        visitSizePrefixType(node) {
            return visitOrElse(node.type, visitor, unexpectedNodeFallback);
        },

        visitSolAmountType(node) {
            return visitOrElse(node.number, visitor, unexpectedNodeFallback);
        },

        visitStringType() {
            return (input: unknown) => input;
        },

        visitStructFieldType(node) {
            return visitOrElse(node.type, visitor, unexpectedNodeFallback);
        },

        visitStructType(node) {
            const fieldTransformers = node.fields.map(field => {
                const transform = visitOrElse(field, visitor, unexpectedNodeFallback);
                return { name: field.name, transform };
            });
            return (input: unknown) => {
                if (!isObjectRecord(input)) {
                    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE, {
                        actualType: formatValueType(input),
                        expectedType: 'object',
                        nodeKind: 'structTypeNode',
                    });
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
            const itemTransforms = node.items.map(item => visitOrElse(item, visitor, unexpectedNodeFallback));
            return (input: unknown) => {
                if (!Array.isArray(input)) {
                    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE, {
                        actualType: formatValueType(input),
                        expectedType: 'array',
                        nodeKind: 'tupleTypeNode',
                    });
                }
                if (input.length !== itemTransforms.length) {
                    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE, {
                        actualType: `array(length:${input.length})`,
                        expectedType: `array(length:${itemTransforms.length})`,
                        nodeKind: 'tupleTypeNode',
                    });
                }
                return input.map((value: unknown, index) => itemTransforms[index](value));
            };
        },

        visitZeroableOptionType(node) {
            const innerTransform = visitOrElse(node.item, visitor, unexpectedNodeFallback);
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
    return visitOrElse(typeNode, visitor, unexpectedNodeFallback);
}
