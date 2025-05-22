import { CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, CodamaError } from '@codama/errors';
import {
    arrayTypeNode,
    CountNode,
    fixedCountNode,
    isNode,
    NumberTypeNode,
    numberTypeNode,
    pascalCase,
    prefixedCountNode,
    REGISTERED_TYPE_NODE_KINDS,
    remainderCountNode,
    resolveNestedTypeNode,
    snakeCase,
    titleCase,
} from '@codama/nodes';
import { extendVisitor, mergeVisitor, pipe, visit } from '@codama/visitors-core';

import { ImportMap } from './ImportMap';
import { GetImportFromFunction, GetTraitsFromNodeFunction } from './utils';

const MATRIX_TYPE_REGEX = /repeated\s+repeated\s+([a-zA-Z_][\w]*)/g;

export type TypeManifest = {
    definedTypes?: string;
    imports: ImportMap;
    nestedStructs: string[];
    type: string;
};

export function numberTypeToProtoHelper(numberType: NumberTypeNode): string {
    switch (numberType.format) {
        case 'u8':
        case 'u16':
        case 'u32':
            return 'uint32';
        case 'u64':
            return 'uint64';
        case 'u128':
            return 'string';
        case 'i8':
        case 'i16':
        case 'i32':
            return 'int32';
        case 'i64':
            return 'int64';
        case 'i128':
            return 'string';
        case 'f32':
            return 'float';
        case 'f64':
            return 'double';
        default:
            throw new Error(`Number format not supported: ${numberType.format}`);
    }
}

export function getProtoTypeManifestVisitor(options: {
    getImportFrom: GetImportFromFunction;
    getTraitsFromNode: GetTraitsFromNodeFunction;
    nestedStruct?: boolean;
    parentName?: string | null;
}) {
    const { getTraitsFromNode } = options;
    let parentName: string | null = options.parentName ?? null;
    let nestedStruct: boolean = options.nestedStruct ?? false;
    let inlineStruct: boolean = false;
    let parentSize: NumberTypeNode | number | null = null;

    return pipe(
        mergeVisitor(
            (): TypeManifest => ({ imports: new ImportMap(), nestedStructs: [], type: '' }),
            (_, values) => ({
                ...mergeManifests(values),
                type: values.map(v => v.type).join('\n'),
            }),
            { keys: [...REGISTERED_TYPE_NODE_KINDS, 'definedTypeLinkNode', 'definedTypeNode', 'accountNode'] },
        ),
        v =>
            extendVisitor(v, {
                visitAccount(account, { self }) {
                    parentName = pascalCase(account.name);
                    const manifest = visit(account.data, self);
                    parentName = null;
                    return {
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: manifest.type,
                    };
                },

                visitArrayType(arrayType, { self }) {
                    const childManifest = visit(arrayType.item, self);

                    return {
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: `repeated ${childManifest.type}`,
                    };
                },

                visitBooleanType(booleanType) {
                    const resolvedSize = resolveNestedTypeNode(booleanType.size);
                    if (resolvedSize.format === 'u8' && resolvedSize.endian === 'le') {
                        return {
                            imports: new ImportMap(),
                            nestedStructs: [],
                            type: 'bool',
                        };
                    }

                    throw new Error('Boolean size not supported');
                },

                visitBytesType(_bytesType, { self }) {
                    let arraySize: CountNode = remainderCountNode();
                    if (typeof parentSize === 'number') {
                        arraySize = fixedCountNode(parentSize);
                    } else if (parentSize && typeof parentSize === 'object') {
                        arraySize = prefixedCountNode(parentSize);
                    }
                    const arrayType = arrayTypeNode(numberTypeNode('u8'), arraySize);
                    return visit(arrayType, self);
                },

                visitDefinedType(definedType, { self }) {
                    parentName = pascalCase(definedType.name);
                    const manifest = visit(definedType.type, self);
                    const traits = getTraitsFromNode(definedType);
                    manifest.imports.mergeWith(traits.imports);
                    parentName = null;

                    const renderedType = isNode(definedType.type, ['enumTypeNode', 'structTypeNode'])
                        ? manifest.type
                        : `pub type ${pascalCase(definedType.name)} = ${manifest.type};`;

                    return { ...manifest, type: `${traits.render}${renderedType}` };
                },

                visitDefinedTypeLink(node) {
                    const pascalCaseDefinedType = pascalCase(node.name);

                    return {
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: pascalCaseDefinedType,
                    };
                },

                visitEnumEmptyVariantType(enumEmptyVariantType) {
                    const name = pascalCase(enumEmptyVariantType.name);
                    return {
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: `${name}`,
                    };
                },

                visitEnumStructVariantType(enumStructVariantType, { self }) {
                    const name = pascalCase(enumStructVariantType.name);
                    const originalParentName = parentName;

                    if (!originalParentName) {
                        throw new Error('Enum struct variant type must have a parent name.');
                    }

                    inlineStruct = true;
                    parentName = pascalCase(originalParentName) + name;
                    const typeManifest = visit(enumStructVariantType.struct, self);
                    inlineStruct = false;
                    parentName = originalParentName;

                    return {
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: typeManifest.type,
                    };
                },

                visitEnumTupleVariantType(enumTupleVariantType, { self }) {
                    const name = pascalCase(enumTupleVariantType.name);
                    const originalParentName = parentName;

                    if (!originalParentName) {
                        throw new Error('Enum struct variant type must have a parent name.');
                    }

                    parentName = pascalCase(originalParentName) + name;
                    const childManifest = visit(enumTupleVariantType.tuple, self);
                    parentName = originalParentName;

                    return {
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: `${childManifest.type}`,
                    };
                },

                visitEnumType(enumType, { self }) {
                    const originalParentName = parentName;
                    if (!originalParentName) {
                        // TODO: Add to the Rust validator.
                        throw new Error('Enum type must have a parent name.');
                    }

                    const variantNames = enumType.variants.map(variant => variant.name);
                    const variants = enumType.variants.map(variant => visit(variant, self));
                    const variantTypes = variants.map(v => v.type);

                    const enumHasDefinedType = variantTypes.some(type => type.includes('message'));

                    // If the enum has no defined type, we can just use the variant names as the enum type.
                    if (!enumHasDefinedType) {
                        const variantNames = variants
                            .map(
                                (variant, i) =>
                                    `\t${pascalCase(originalParentName) + pascalCase(variant.type)} = ${i};`,
                            )
                            .join('\n');
                        return {
                            imports: new ImportMap(),
                            nestedStructs: [],
                            type: `enum ${pascalCase(originalParentName)} {\n${variantNames}\n}\n`,
                        };
                    }

                    // If the enum has defined types, we need to create message type for each variant.
                    const definedVariants = variantNames
                        .map((variant, i) => {
                            return `\t\t${pascalCase(originalParentName) + pascalCase(variant)} ${snakeCase(variant)} = ${i + 1};`;
                        })
                        .join('\n');

                    const nestedVariantTypes: string[] = [];
                    for (let i = 0; i < variantTypes.length; i++) {
                        const variant = variantTypes[i];
                        const variantTypeArray = variant.split(' ');
                        const name = variantTypeArray[variantTypeArray.length - 1];
                        const outerType = variantTypeArray[0];
                        const isVariantEmpty = enumType.variants[i].kind === 'enumEmptyVariantTypeNode';

                        // handle nested Tuple types
                        if (outerType === 'repeated') {
                            const innerType = variant.split(' ').slice(1, -1).join(' ');
                            nestedVariantTypes.push(
                                `message ${pascalCase(name)} {\n\t${innerType} ${snakeCase(name)} = ${i + 1};\n}\n`,
                            );
                            // handle nested Struct types
                        } else if (outerType === 'message') {
                            nestedVariantTypes.push(variant);
                        } else if (isVariantEmpty) {
                            // If variant was empty but enum contains a mix of empty and non-empty variants, we also add a
                            //  marker empty msg for the empty variant.
                            nestedVariantTypes.push(`message ${pascalCase(originalParentName) + variant} { }\n`);
                        }
                    }
                    const additionalTypes: string[] = [];

                    additionalTypes.push(...nestedVariantTypes);

                    return {
                        definedTypes: additionalTypes.join('\n'),
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: `message ${pascalCase(originalParentName)} {\n\toneof variant{\n${definedVariants}\n\t}\n}\n`,
                    };
                },

                visitFixedSizeType(fixedSizeType, { self }) {
                    parentSize = fixedSizeType.size;
                    const manifest = visit(fixedSizeType.type, self);
                    parentSize = null;
                    return manifest;
                },

                visitMapType(mapType, { self }) {
                    const key = visit(mapType.key, self);
                    const value = visit(mapType.value, self);

                    return {
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: `map<${key.type}, ${value.type}> = 1`,
                    };
                },

                visitNumberType(numberType) {
                    if (numberType.endian !== 'le') {
                        // TODO: Add to the Rust validator.
                        throw new Error('Number endianness not supported by Borsh');
                    }

                    const type = numberTypeToProtoHelper(numberType);

                    return {
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: type,
                    };
                },

                visitOptionType(optionType, { self }) {
                    const childManifest = visit(optionType.item, self);

                    const optionPrefix = resolveNestedTypeNode(optionType.prefix);
                    if (optionPrefix.format === 'u8' && optionPrefix.endian === 'le') {
                        return {
                            ...childManifest,
                            type: `optional ${childManifest.type}`,
                        };
                    }

                    // TODO: Add to the Rust validator.
                    throw new Error('Option size not supported by Borsh');
                },

                visitPublicKeyType() {
                    return {
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: 'string',
                    };
                },

                visitRemainderOptionType(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },

                visitSetType(setType, { self }) {
                    const childManifest = visit(setType.item, self);
                    return {
                        ...childManifest,
                        type: `repeated ${childManifest.type}>`,
                    };
                },

                visitSizePrefixType(sizePrefixType, { self }) {
                    parentSize = resolveNestedTypeNode(sizePrefixType.prefix);
                    const manifest = visit(sizePrefixType.type, self);
                    parentSize = null;
                    return manifest;
                },

                visitStringType() {
                    return {
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: 'string',
                    };
                },

                visitStructFieldType(structFieldType, { self }) {
                    const originalParentName = parentName;
                    const originalInlineStruct = inlineStruct;
                    const originalNestedStruct = nestedStruct;

                    if (!originalParentName) {
                        throw new Error('Struct field type must have a parent name.');
                    }

                    parentName = pascalCase(originalParentName) + pascalCase(structFieldType.name);
                    nestedStruct = true;
                    inlineStruct = false;

                    const fieldManifest = visit(structFieldType.type, self);

                    parentName = originalParentName;
                    inlineStruct = originalInlineStruct;
                    nestedStruct = originalNestedStruct;

                    const fieldName = snakeCase(structFieldType.name);

                    if (fieldName === 'discriminator') {
                        return {
                            imports: new ImportMap(),
                            nestedStructs: [],
                            type: '',
                        };
                    }

                    return {
                        ...fieldManifest,
                        type: `\t${fieldManifest.type} ${fieldName}`,
                    };
                },

                visitStructType(structType, { self }) {
                    const originalParentName = parentName;

                    if (!originalParentName) {
                        // TODO: Add to the Rust validator.
                        throw new Error('Struct type must have a parent name.');
                    }

                    const fields = structType.fields
                        .map(field => visit(field, self))
                        .filter(field => field.type !== '');
                    const fieldTypes = fields.map((field, idx) => `${field.type} = ${idx + 1};`).join('\n');

                    return {
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: `message ${pascalCase(originalParentName)} {\n${fieldTypes}\n}\n`,
                    };
                },

                visitTupleType(tupleType, { self }) {
                    const originalParentName = parentName;
                    if (!originalParentName) {
                        throw new Error('Tuple type must have a parent name.');
                    }

                    const fields = tupleType.items.reduce((acc, field, idx) => {
                        const fieldManifest = visit(field, self);
                        return `${acc}  ${fieldManifest.type} field_${idx} = ${idx + 1};\n`;
                    }, '');

                    return {
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: `message ${pascalCase(originalParentName)} {\n${fields}}\n`,
                    };
                },

                visitZeroableOptionType(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },
            }),
    );
}

function mergeManifests(manifests: TypeManifest[]): Pick<TypeManifest, 'imports' | 'nestedStructs'> {
    return {
        imports: new ImportMap().mergeWith(...manifests.map(td => td.imports)),
        nestedStructs: manifests.flatMap(m => m.nestedStructs),
    };
}

export function fixMatrix(proto: string): string {
    return proto.replace(MATRIX_TYPE_REGEX, (_, typeName: string) => {
        return `repeated Repeated${titleCase(typeName)}Row`;
    });
}

export function checkArrayTypeAndFix(proto: string, matrixTypes: Set<string>): string {
    const tokens = proto.split(/\s+/).filter(Boolean); // simple tokenization

    for (let i = 0; i < tokens.length - 2; i++) {
        if (tokens[i] === 'repeated' && tokens[i + 1] === 'repeated') {
            const type = tokens[i + 2];
            matrixTypes.add(type);
        }
    }

    return fixMatrix(proto);
}
