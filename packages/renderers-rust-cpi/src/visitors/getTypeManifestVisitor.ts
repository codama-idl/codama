import { CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, CodamaError } from '@codama/errors';
import {
    arrayTypeNode,
    CountNode,
    definedTypeNode,
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
} from '@codama/nodes';
import { extendVisitor, mergeVisitor, pipe, visit } from '@codama/visitors-core';

import {
    addFragmentImports,
    Fragment,
    fragment,
    getDocblockFragment,
    GetImportFromFunction,
    GetTraitsFromNodeFunction,
    mergeFragments,
} from '../utils';

export type TypeManifest = {
    nestedStructs: Fragment[];
    type: Fragment;
};

export type TypeManifestVisitor = ReturnType<typeof getTypeManifestVisitor>;

export function getTypeManifestVisitor(options: {
    getImportFrom: GetImportFromFunction;
    getTraitsFromNode: GetTraitsFromNodeFunction;
    nestedStruct?: boolean;
    parentName?: string | null;
}) {
    const { getImportFrom, getTraitsFromNode } = options;
    let parentName: string | null = options.parentName ?? null;
    let nestedStruct: boolean = options.nestedStruct ?? false;
    let inlineStruct: boolean = false;
    let parentSize: NumberTypeNode | number | null = null;

    return pipe(
        mergeVisitor(
            (): TypeManifest => ({ nestedStructs: [], type: fragment`` }),
            (_, manifests) => mergeManifests(manifests),
            { keys: [...REGISTERED_TYPE_NODE_KINDS, 'definedTypeLinkNode', 'definedTypeNode', 'accountNode'] },
        ),
        v =>
            extendVisitor(v, {
                visitAccount(account, { self }) {
                    parentName = pascalCase(account.name);
                    const manifest = visit(account.data, self);
                    const traits = getTraitsFromNode(account);
                    parentName = null;
                    return { ...manifest, type: fragment`${traits}${manifest.type}` };
                },

                visitArrayType(arrayType, { self }) {
                    const childManifest = visit(arrayType.item, self);

                    if (isNode(arrayType.count, 'fixedCountNode')) {
                        return {
                            ...childManifest,
                            type: fragment`[${childManifest.type}; ${arrayType.count.value}]`,
                        };
                    }

                    // TODO: Add to the Rust validator.
                    throw new Error('Array size currently not supported.');
                },

                visitBooleanType(booleanType) {
                    const resolvedSize = resolveNestedTypeNode(booleanType.size);
                    if (resolvedSize.format === 'u8' && resolvedSize.endian === 'le') {
                        return { nestedStructs: [], type: fragment`bool` };
                    }

                    // TODO: Add to the Rust validator.
                    throw new Error('Bool size currently not supported.');
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
                    parentName = null;

                    const renderedType = isNode(definedType.type, ['enumTypeNode', 'structTypeNode'])
                        ? manifest.type
                        : fragment`pub type ${pascalCase(definedType.name)} = ${manifest.type};`;

                    return { ...manifest, type: fragment`${traits}${renderedType}` };
                },

                visitDefinedTypeLink(node) {
                    const pascalCaseDefinedType = pascalCase(node.name);
                    const importFrom = getImportFrom(node);
                    return {
                        nestedStructs: [],
                        type: addFragmentImports(fragment`${pascalCaseDefinedType}`, [
                            `${importFrom}::${pascalCaseDefinedType}`,
                        ]),
                    };
                },

                visitEnumEmptyVariantType(enumEmptyVariantType) {
                    const name = pascalCase(enumEmptyVariantType.name);
                    return { nestedStructs: [], type: fragment`${name},` };
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
                        ...typeManifest,
                        type: fragment`${name} ${typeManifest.type},`,
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

                    let derive = '';
                    if (childManifest.type.content === '(Pubkey)') {
                        derive =
                            '#[cfg_attr(feature = "serde", serde(with = "serde_with::As::<serde_with::DisplayFromStr>"))]\n';
                    } else if (childManifest.type.content === '(Vec<Pubkey>)') {
                        derive =
                            '#[cfg_attr(feature = "serde", serde(with = "serde_with::As::<Vec<serde_with::DisplayFromStr>>"))]\n';
                    }

                    return {
                        ...childManifest,
                        type: fragment`${derive}${name}${childManifest.type},`,
                    };
                },

                visitEnumType(enumType, { self }) {
                    const originalParentName = parentName;
                    if (!originalParentName) {
                        // TODO: Add to the Rust validator.
                        throw new Error('Enum type must have a parent name.');
                    }

                    const variants = enumType.variants.map(variant => visit(variant, self));
                    const mergedManifest = mergeManifests(variants);

                    return {
                        ...mergedManifest,
                        type: fragment`pub enum ${pascalCase(originalParentName)} {\n${mergedManifest.type}\n}`,
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
                    const mergedManifest = mergeManifests([key, value]);
                    return {
                        ...mergedManifest,
                        type: addFragmentImports(fragment`HashMap<${key.type}, ${value.type}>`, [
                            'std::collections::HashMap',
                        ]),
                    };
                },

                visitNumberType(numberType) {
                    if (numberType.endian !== 'le') {
                        // TODO: Add to the Rust validator.
                        throw new Error('Number endianness currently not supported.');
                    }

                    if (numberType.format === 'shortU16') {
                        return {
                            nestedStructs: [],
                            type: addFragmentImports(fragment`ShortU16`, ['solana_program::short_vec::ShortU16']),
                        };
                    }

                    return { nestedStructs: [], type: fragment`${numberType.format}` };
                },

                visitOptionType(optionType, { self }) {
                    const childManifest = visit(optionType.item, self);

                    const optionPrefix = resolveNestedTypeNode(optionType.prefix);
                    if (optionPrefix.format === 'u8' && optionPrefix.endian === 'le') {
                        return {
                            ...childManifest,
                            type: fragment`Option<${childManifest.type}>`,
                        };
                    }

                    // TODO: Add to the Rust validator.
                    throw new Error('Option size currently not supported.');
                },

                visitPublicKeyType() {
                    return {
                        nestedStructs: [],
                        type: addFragmentImports(fragment`Pubkey`, ['pinocchio::pubkey::Pubkey']),
                    };
                },

                visitRemainderOptionType(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },

                visitSetType(setType, { self }) {
                    const childManifest = visit(setType.item, self);
                    return {
                        ...childManifest,
                        type: addFragmentImports(fragment`HashSet<${childManifest.type}>`, [
                            'std::collections::HashSet',
                        ]),
                    };
                },

                visitSizePrefixType(sizePrefixType, { self }) {
                    parentSize = resolveNestedTypeNode(sizePrefixType.prefix);
                    const manifest = visit(sizePrefixType.type, self);
                    parentSize = null;
                    return manifest;
                },

                visitStringType() {
                    if (!parentSize) {
                        return { nestedStructs: [], type: fragment`str` };
                    }

                    if (typeof parentSize === 'number') {
                        return { nestedStructs: [], type: fragment`[u8; ${parentSize}]` };
                    }

                    if (isNode(parentSize, 'numberTypeNode') && parentSize.endian === 'le') {
                        switch (parentSize.format) {
                            case 'u32':
                                return { nestedStructs: [], type: fragment`String` };
                            case 'u8':
                            case 'u16':
                            case 'u64': {
                                const prefix = parentSize.format.toUpperCase();
                                return {
                                    nestedStructs: [],
                                    type: addFragmentImports(fragment`${prefix}PrefixString`, [
                                        `kaigan::types::${prefix}PrefixString`,
                                    ]),
                                };
                            }
                            default:
                                throw new Error(`String size not supported: ${parentSize.format}`);
                        }
                    }

                    // TODO: Add to the Rust validator.
                    throw new Error(`String size currently not supported: ${parentSize.format}`);
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
                    const docs = getDocblockFragment(structFieldType.docs ?? [], true);
                    const resolvedNestedType = resolveNestedTypeNode(structFieldType.type);

                    let derive = '';
                    if (fieldManifest.type.content === 'Pubkey') {
                        derive =
                            '#[cfg_attr(feature = "serde", serde(with = "serde_with::As::<serde_with::DisplayFromStr>"))]\n';
                    } else if (fieldManifest.type.content === 'Vec<Pubkey>') {
                        derive =
                            '#[cfg_attr(feature = "serde", serde(with = "serde_with::As::<Vec<serde_with::DisplayFromStr>>"))]\n';
                    } else if (
                        (isNode(resolvedNestedType, 'arrayTypeNode') &&
                            isNode(resolvedNestedType.count, 'fixedCountNode') &&
                            resolvedNestedType.count.value > 32) ||
                        (isNode(resolvedNestedType, ['bytesTypeNode', 'stringTypeNode']) &&
                            isNode(structFieldType.type, 'fixedSizeTypeNode') &&
                            structFieldType.type.size > 32)
                    ) {
                        derive =
                            '#[cfg_attr(feature = "serde", serde(with = "serde_with::As::<serde_with::Bytes>"))]\n';
                    }

                    return {
                        ...fieldManifest,
                        type: inlineStruct
                            ? fragment`${docs}${derive}${fieldName}: ${fieldManifest.type},`
                            : fragment`${docs}${derive}pub ${fieldName}: ${fieldManifest.type},`,
                    };
                },

                visitStructType(structType, { self }) {
                    const originalParentName = parentName;

                    if (!originalParentName) {
                        // TODO: Add to the Rust validator.
                        throw new Error('Struct type must have a parent name.');
                    }

                    const fields = structType.fields.map(field => visit(field, self));
                    const mergedManifest = mergeManifests(fields);

                    if (nestedStruct) {
                        const nestedTraits = getTraitsFromNode(
                            definedTypeNode({ name: originalParentName, type: structType }),
                        );
                        return {
                            ...mergedManifest,
                            nestedStructs: [
                                ...mergedManifest.nestedStructs,
                                fragment`${nestedTraits}pub struct ${pascalCase(originalParentName)} {\n${mergedManifest.type}\n}`,
                            ],
                            type: fragment`${pascalCase(originalParentName)}`,
                        };
                    }

                    if (inlineStruct) {
                        return { ...mergedManifest, type: fragment`{\n${mergedManifest.type}\n}` };
                    }

                    return {
                        ...mergedManifest,
                        type: fragment`pub struct ${pascalCase(originalParentName)} {\n${mergedManifest.type}\n}`,
                    };
                },

                visitTupleType(tupleType, { self }) {
                    const items = tupleType.items.map(item => visit(item, self));
                    const mergedManifest = mergeManifests(items);

                    return {
                        ...mergedManifest,
                        type: mergeFragments(
                            items.map(i => i.type),
                            cs => `(${cs.join(', ')})`,
                        ),
                    };
                },

                visitZeroableOptionType(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },
            }),
    );
}

function mergeManifests(manifests: TypeManifest[]): TypeManifest {
    return {
        nestedStructs: manifests.flatMap(m => m.nestedStructs),
        type: mergeFragments(
            manifests.map(m => m.type),
            cs => cs.join('\n'),
        ),
    };
}
