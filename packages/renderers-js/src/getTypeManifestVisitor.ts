import {
    camelCase,
    CamelCaseString,
    CountNode,
    isNode,
    isNodeFilter,
    isScalarEnum,
    parseDocs,
    REGISTERED_TYPE_NODE_KINDS,
    REGISTERED_VALUE_NODE_KINDS,
    resolveNestedTypeNode,
    structFieldTypeNode,
    structTypeNode,
    structTypeNodeFromInstructionArgumentNodes,
    TypeNode,
} from '@codama/nodes';
import { mapFragmentContent, setFragmentContent } from '@codama/renderers-core';
import {
    extendVisitor,
    findLastNodeFromPath,
    LinkableDictionary,
    NodeStack,
    pipe,
    recordNodeStackVisitor,
    staticVisitor,
    visit,
    Visitor,
} from '@codama/visitors-core';

import { ImportMap } from './ImportMap';
import { NameApi } from './nameTransformers';
import { mergeTypeManifests, TypeManifest, typeManifest } from './TypeManifest';
import {
    addFragmentImports,
    Fragment,
    fragment,
    getBytesFromBytesValueNode,
    GetImportFromFunction,
    jsDocblock,
    mergeFragmentImports,
    mergeFragments,
    ParsedCustomDataOptions,
} from './utils';

export type TypeManifestVisitor = ReturnType<typeof getTypeManifestVisitor>;

export function getTypeManifestVisitor(input: {
    customAccountData: ParsedCustomDataOptions;
    customInstructionData: ParsedCustomDataOptions;
    getImportFrom: GetImportFromFunction;
    linkables: LinkableDictionary;
    nameApi: NameApi;
    nonScalarEnums: CamelCaseString[];
    stack?: NodeStack;
}) {
    const { nameApi, linkables, nonScalarEnums, customAccountData, customInstructionData, getImportFrom } = input;
    const stack = input.stack ?? new NodeStack();
    let parentName: { loose: string; strict: string } | null = null;

    return pipe(
        staticVisitor(() => typeManifest(), {
            keys: [
                ...REGISTERED_TYPE_NODE_KINDS,
                ...REGISTERED_VALUE_NODE_KINDS,
                'definedTypeLinkNode',
                'definedTypeNode',
                'accountNode',
                'instructionNode',
            ],
        }),
        visitor =>
            extendVisitor(visitor, {
                visitAccount(account, { self }) {
                    parentName = {
                        loose: nameApi.dataArgsType(account.name),
                        strict: nameApi.dataType(account.name),
                    };
                    const link = customAccountData.get(account.name)?.linkNode;
                    const manifest = link ? visit(link, self) : visit(account.data, self);
                    parentName = null;
                    return manifest;
                },

                visitAmountType(amountType, { self }) {
                    return visit(amountType.number, self);
                },

                visitArrayType(arrayType, { self }) {
                    const childManifest = visit(arrayType.item, self);
                    const sizeManifest = getArrayLikeSizeOption(arrayType.count, self);
                    const encoderOptions = sizeManifest.encoder.content ? `, { ${sizeManifest.encoder.content} }` : '';
                    const decoderOptions = sizeManifest.decoder.content ? `, { ${sizeManifest.decoder.content} }` : '';

                    return typeManifest({
                        ...childManifest,
                        decoder: pipe(
                            childManifest.decoder,
                            f => mapFragmentContent(f, c => `getArrayDecoder(${c + decoderOptions})`),
                            f => mergeFragmentImports(f, [sizeManifest.decoder.imports]),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getArrayDecoder']),
                        ),
                        encoder: pipe(
                            childManifest.encoder,
                            f => mapFragmentContent(f, c => `getArrayEncoder(${c + encoderOptions})`),
                            f => mergeFragmentImports(f, [sizeManifest.encoder.imports]),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getArrayEncoder']),
                        ),
                        looseType: mapFragmentContent(childManifest.looseType, c => `Array<${c}>`),
                        strictType: mapFragmentContent(childManifest.strictType, c => `Array<${c}>`),
                    });
                },

                visitArrayValue(node, { self }) {
                    return mergeTypeManifests(
                        node.items.map(v => visit(v, self)),
                        { mergeValues: renders => `[${renders.join(', ')}]` },
                    );
                },

                visitBooleanType(booleanType, { self }) {
                    const encoderImports = new ImportMap().add('solanaCodecsDataStructures', 'getBooleanEncoder');
                    const decoderImports = new ImportMap().add('solanaCodecsDataStructures', 'getBooleanDecoder');

                    let sizeEncoder = '';
                    let sizeDecoder = '';
                    const resolvedSize = resolveNestedTypeNode(booleanType.size);
                    if (resolvedSize.format !== 'u8' || resolvedSize.endian !== 'le') {
                        const size = visit(booleanType.size, self);
                        encoderImports.mergeWith(size.encoder);
                        decoderImports.mergeWith(size.decoder);
                        sizeEncoder = `{ size: ${size.encoder.content} }`;
                        sizeDecoder = `{ size: ${size.decoder.content} }`;
                    }

                    return typeManifest({
                        decoder: pipe(fragment(`getBooleanDecoder(${sizeDecoder})`), f =>
                            mergeFragmentImports(f, [decoderImports]),
                        ),
                        encoder: pipe(fragment(`getBooleanEncoder(${sizeEncoder})`), f =>
                            mergeFragmentImports(f, [encoderImports]),
                        ),
                        looseType: fragment('boolean'),
                        strictType: fragment('boolean'),
                    });
                },

                visitBooleanValue(node) {
                    return typeManifest({
                        value: fragment(JSON.stringify(node.boolean)),
                    });
                },

                visitBytesType() {
                    const readonlyUint8Array = pipe(fragment('ReadonlyUint8Array'), f =>
                        addFragmentImports(f, 'solanaCodecsCore', ['type ReadonlyUint8Array']),
                    );
                    return typeManifest({
                        decoder: pipe(fragment(`getBytesDecoder()`), f =>
                            addFragmentImports(f, 'solanaCodecsDataStructures', ['getBytesDecoder']),
                        ),
                        encoder: pipe(fragment(`getBytesEncoder()`), f =>
                            addFragmentImports(f, 'solanaCodecsDataStructures', ['getBytesEncoder']),
                        ),
                        looseType: readonlyUint8Array,
                        strictType: readonlyUint8Array,
                    });
                },

                visitBytesValue(node) {
                    const bytes = getBytesFromBytesValueNode(node);
                    return typeManifest({
                        value: fragment(`new Uint8Array([${Array.from(bytes).join(', ')}])`),
                    });
                },

                visitConstantValue(node, { self }) {
                    if (isNode(node.type, 'bytesTypeNode') && isNode(node.value, 'bytesValueNode')) {
                        return visit(node.value, self);
                    }
                    return typeManifest({
                        value: mergeFragments(
                            [visit(node.type, self).encoder, visit(node.value, self).value],
                            ([encoderFunction, value]) => `${encoderFunction}.encode(${value})`,
                        ),
                    });
                },

                visitDateTimeType(dateTimeType, { self }) {
                    return visit(dateTimeType.number, self);
                },

                visitDefinedType(definedType, { self }) {
                    parentName = {
                        loose: nameApi.dataArgsType(definedType.name),
                        strict: nameApi.dataType(definedType.name),
                    };
                    const manifest = visit(definedType.type, self);
                    parentName = null;
                    return manifest;
                },

                visitDefinedTypeLink(node) {
                    const strictName = nameApi.dataType(node.name);
                    const looseName = nameApi.dataArgsType(node.name);
                    const encoderFunction = nameApi.encoderFunction(node.name);
                    const decoderFunction = nameApi.decoderFunction(node.name);
                    const importFrom = getImportFrom(node);

                    return typeManifest({
                        decoder: pipe(fragment(`${decoderFunction}()`), f =>
                            addFragmentImports(f, importFrom, [decoderFunction]),
                        ),
                        encoder: pipe(fragment(`${encoderFunction}()`), f =>
                            addFragmentImports(f, importFrom, [encoderFunction]),
                        ),
                        looseType: pipe(fragment(looseName), f =>
                            addFragmentImports(f, importFrom, [`type ${looseName}`]),
                        ),
                        strictType: pipe(fragment(strictName), f =>
                            addFragmentImports(f, importFrom, [`type ${strictName}`]),
                        ),
                    });
                },

                visitEnumEmptyVariantType(enumEmptyVariantType) {
                    const discriminator = nameApi.discriminatedUnionDiscriminator(camelCase(parentName?.strict ?? ''));
                    const name = nameApi.discriminatedUnionVariant(enumEmptyVariantType.name);
                    const kindAttribute = `${discriminator}: "${name}"`;
                    return typeManifest({
                        decoder: pipe(fragment(`['${name}', getUnitDecoder()]`), f =>
                            addFragmentImports(f, 'solanaCodecsDataStructures', ['getUnitDecoder']),
                        ),
                        encoder: pipe(fragment(`['${name}', getUnitEncoder()]`), f =>
                            addFragmentImports(f, 'solanaCodecsDataStructures', ['getUnitEncoder']),
                        ),
                        looseType: fragment(`{ ${kindAttribute} }`),
                        strictType: fragment(`{ ${kindAttribute} }`),
                    });
                },

                visitEnumStructVariantType(enumStructVariantType, { self }) {
                    const currentParentName = parentName;
                    const discriminator = nameApi.discriminatedUnionDiscriminator(
                        camelCase(currentParentName?.strict ?? ''),
                    );
                    const name = nameApi.discriminatedUnionVariant(enumStructVariantType.name);
                    const kindAttribute = `${discriminator}: "${name}"`;

                    parentName = null;
                    const structManifest = visit(enumStructVariantType.struct, self);
                    parentName = currentParentName;

                    return typeManifest({
                        ...structManifest,
                        decoder: pipe(structManifest.decoder, f => mapFragmentContent(f, c => `['${name}', ${c}]`)),
                        encoder: pipe(structManifest.encoder, f => mapFragmentContent(f, c => `['${name}', ${c}]`)),
                        looseType: pipe(structManifest.looseType, f =>
                            mapFragmentContent(f, c => `{ ${kindAttribute},${c.slice(1, -1)}}`),
                        ),
                        strictType: pipe(structManifest.strictType, f =>
                            mapFragmentContent(f, c => `{ ${kindAttribute},${c.slice(1, -1)}}`),
                        ),
                    });
                },

                visitEnumTupleVariantType(enumTupleVariantType, { self }) {
                    const currentParentName = parentName;
                    const discriminator = nameApi.discriminatedUnionDiscriminator(
                        camelCase(currentParentName?.strict ?? ''),
                    );
                    const name = nameApi.discriminatedUnionVariant(enumTupleVariantType.name);
                    const kindAttribute = `${discriminator}: "${name}"`;
                    const struct = structTypeNode([
                        structFieldTypeNode({
                            name: 'fields',
                            type: enumTupleVariantType.tuple,
                        }),
                    ]);

                    parentName = null;
                    const structManifest = visit(struct, self);
                    parentName = currentParentName;

                    return typeManifest({
                        ...structManifest,
                        decoder: pipe(structManifest.decoder, f => mapFragmentContent(f, c => `['${name}', ${c}]`)),
                        encoder: pipe(structManifest.encoder, f => mapFragmentContent(f, c => `['${name}', ${c}]`)),
                        looseType: pipe(structManifest.looseType, f =>
                            mapFragmentContent(f, c => `{ ${kindAttribute},${c.slice(1, -1)}}`),
                        ),
                        strictType: pipe(structManifest.strictType, f =>
                            mapFragmentContent(f, c => `{ ${kindAttribute},${c.slice(1, -1)}}`),
                        ),
                    });
                },

                visitEnumType(enumType, { self }) {
                    const currentParentName = parentName;
                    const encoderImports = new ImportMap();
                    const decoderImports = new ImportMap();
                    const encoderOptions: string[] = [];
                    const decoderOptions: string[] = [];

                    const enumSize = resolveNestedTypeNode(enumType.size);
                    if (enumSize.format !== 'u8' || enumSize.endian !== 'le') {
                        const sizeManifest = visit(enumType.size, self);
                        encoderImports.mergeWith(sizeManifest.encoder);
                        decoderImports.mergeWith(sizeManifest.decoder);
                        encoderOptions.push(`size: ${sizeManifest.encoder.content}`);
                        decoderOptions.push(`size: ${sizeManifest.decoder.content}`);
                    }

                    const discriminator = nameApi.discriminatedUnionDiscriminator(
                        camelCase(currentParentName?.strict ?? ''),
                    );
                    if (!isScalarEnum(enumType) && discriminator !== '__kind') {
                        encoderOptions.push(`discriminator: '${discriminator}'`);
                        decoderOptions.push(`discriminator: '${discriminator}'`);
                    }

                    const encoderOptionsAsString =
                        encoderOptions.length > 0 ? `, { ${encoderOptions.join(', ')} }` : '';
                    const decoderOptionsAsString =
                        decoderOptions.length > 0 ? `, { ${decoderOptions.join(', ')} }` : '';

                    if (isScalarEnum(enumType)) {
                        if (currentParentName === null) {
                            throw new Error(
                                'Scalar enums cannot be inlined and must be introduced ' +
                                    'via a defined type. Ensure you are not inlining a ' +
                                    'defined type that is a scalar enum through a visitor.',
                            );
                        }
                        const variantNames = enumType.variants.map(({ name }) => nameApi.enumVariant(name));
                        return typeManifest({
                            decoder: pipe(
                                fragment(`getEnumDecoder(${currentParentName.strict + decoderOptionsAsString})`),
                                f => mergeFragmentImports(f, [decoderImports]),
                                f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getEnumDecoder']),
                            ),
                            encoder: pipe(
                                fragment(`getEnumEncoder(${currentParentName.strict + encoderOptionsAsString})`),
                                f => mergeFragmentImports(f, [encoderImports]),
                                f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getEnumEncoder']),
                            ),
                            isEnum: true,
                            looseType: fragment(`{ ${variantNames.join(', ')} }`),
                            strictType: fragment(`{ ${variantNames.join(', ')} }`),
                        });
                    }

                    const mergedManifest = mergeTypeManifests(
                        enumType.variants.map(variant => visit(variant, self)),
                        {
                            mergeCodecs: renders => renders.join(', '),
                            mergeTypes: renders => renders.join(' | '),
                        },
                    );

                    return typeManifest({
                        ...mergedManifest,
                        decoder: pipe(
                            mergedManifest.decoder,
                            f =>
                                mapFragmentContent(
                                    f,
                                    c => `getDiscriminatedUnionDecoder([${c}]${decoderOptionsAsString})`,
                                ),
                            f => mergeFragmentImports(f, [decoderImports]),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getDiscriminatedUnionDecoder']),
                        ),
                        encoder: pipe(
                            mergedManifest.encoder,
                            f =>
                                mapFragmentContent(
                                    f,
                                    c => `getDiscriminatedUnionEncoder([${c}]${encoderOptionsAsString})`,
                                ),
                            f => mergeFragmentImports(f, [encoderImports]),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getDiscriminatedUnionEncoder']),
                        ),
                    });
                },

                visitEnumValue(node, { self }) {
                    const manifest = typeManifest();
                    const enumName = nameApi.dataType(node.enum.name);
                    const enumFunction = nameApi.discriminatedUnionFunction(node.enum.name);
                    const importFrom = getImportFrom(node.enum);

                    const enumNode = linkables.get([...stack.getPath(), node.enum])?.type;
                    const isScalar =
                        enumNode && isNode(enumNode, 'enumTypeNode')
                            ? isScalarEnum(enumNode)
                            : !nonScalarEnums.includes(node.enum.name);

                    if (!node.value && isScalar) {
                        const variantName = nameApi.enumVariant(node.variant);
                        return typeManifest({
                            ...manifest,
                            value: pipe(
                                manifest.value,
                                f => setFragmentContent(f, `${enumName}.${variantName}`),
                                f => addFragmentImports(f, importFrom, [enumName]),
                            ),
                        });
                    }

                    const variantName = nameApi.discriminatedUnionVariant(node.variant);
                    if (!node.value) {
                        return typeManifest({
                            ...manifest,
                            value: pipe(
                                manifest.value,
                                f => setFragmentContent(f, `${enumFunction}('${variantName}')`),
                                f => addFragmentImports(f, importFrom, [enumFunction]),
                            ),
                        });
                    }

                    return typeManifest({
                        ...manifest,
                        value: pipe(
                            visit(node.value, self).value,
                            f => mapFragmentContent(f, c => `${enumFunction}('${variantName}', ${c})`),
                            f => addFragmentImports(f, importFrom, [enumFunction]),
                        ),
                    });
                },

                visitFixedSizeType(node, { self }) {
                    const manifest = visit(node.type, self);
                    return typeManifest({
                        ...manifest,
                        decoder: pipe(
                            manifest.decoder,
                            f => mapFragmentContent(f, c => `fixDecoderSize(${c}, ${node.size})`),
                            f => addFragmentImports(f, 'solanaCodecsCore', ['fixDecoderSize']),
                        ),
                        encoder: pipe(
                            manifest.encoder,
                            f => mapFragmentContent(f, c => `fixEncoderSize(${c}, ${node.size})`),
                            f => addFragmentImports(f, 'solanaCodecsCore', ['fixEncoderSize']),
                        ),
                    });
                },

                visitHiddenPrefixType(node, { self }) {
                    const manifest = visit(node.type, self);
                    const prefixes = node.prefix.map(c => visit(c, self).value);
                    const prefixEncoders = pipe(
                        mergeFragments(prefixes, contents => contents.map(c => `getConstantEncoder(${c})`).join(', ')),
                        f => addFragmentImports(f, 'solanaCodecsCore', ['getConstantEncoder']),
                    );
                    const prefixDecoders = pipe(
                        mergeFragments(prefixes, contents => contents.map(c => `getConstantDecoder(${c})`).join(', ')),
                        f => addFragmentImports(f, 'solanaCodecsCore', ['getConstantDecoder']),
                    );

                    return typeManifest({
                        ...manifest,
                        decoder: pipe(
                            mergeFragments(
                                [manifest.decoder, prefixDecoders],
                                ([child, prefixes]) => `getHiddenPrefixDecoder(${child}, [${prefixes}])`,
                            ),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getHiddenPrefixDecoder']),
                        ),
                        encoder: pipe(
                            mergeFragments(
                                [manifest.encoder, prefixEncoders],
                                ([child, prefixes]) => `getHiddenPrefixEncoder(${child}, [${prefixes}])`,
                            ),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getHiddenPrefixEncoder']),
                        ),
                    });
                },

                visitHiddenSuffixType(node, { self }) {
                    const manifest = visit(node.type, self);
                    const suffixes = node.suffix.map(c => visit(c, self).value);
                    const suffixEncoders = pipe(
                        mergeFragments(suffixes, contents => contents.map(c => `getConstantEncoder(${c})`).join(', ')),
                        f => addFragmentImports(f, 'solanaCodecsCore', ['getConstantEncoder']),
                    );
                    const suffixDecoders = pipe(
                        mergeFragments(suffixes, contents => contents.map(c => `getConstantDecoder(${c})`).join(', ')),
                        f => addFragmentImports(f, 'solanaCodecsCore', ['getConstantDecoder']),
                    );

                    return typeManifest({
                        ...manifest,
                        decoder: pipe(
                            mergeFragments(
                                [manifest.decoder, suffixDecoders],
                                ([child, suffixes]) => `getHiddenSuffixDecoder(${child}, [${suffixes}])`,
                            ),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getHiddenSuffixDecoder']),
                        ),
                        encoder: pipe(
                            mergeFragments(
                                [manifest.encoder, suffixEncoders],
                                ([child, suffixes]) => `getHiddenSuffixEncoder(${child}, [${suffixes}])`,
                            ),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getHiddenSuffixEncoder']),
                        ),
                    });
                },

                visitInstruction(instruction, { self }) {
                    const instructionDataName = nameApi.instructionDataType(instruction.name);
                    parentName = {
                        loose: nameApi.dataArgsType(instructionDataName),
                        strict: nameApi.dataType(instructionDataName),
                    };
                    const link = customInstructionData.get(instruction.name)?.linkNode;
                    const struct = structTypeNodeFromInstructionArgumentNodes(instruction.arguments);
                    const manifest = link ? visit(link, self) : visit(struct, self);
                    parentName = null;
                    return manifest;
                },

                visitMapEntryValue(node, { self }) {
                    return mergeTypeManifests([visit(node.key, self), visit(node.value, self)], {
                        mergeValues: renders => `[${renders.join(', ')}]`,
                    });
                },

                visitMapType(mapType, { self }) {
                    const key = visit(mapType.key, self);
                    const value = visit(mapType.value, self);
                    const mergedManifest = mergeTypeManifests([key, value], {
                        mergeCodecs: ([k, v]) => `${k}, ${v}`,
                        mergeTypes: ([k, v]) => `Map<${k}, ${v}>`,
                    });
                    const sizeManifest = getArrayLikeSizeOption(mapType.count, self);
                    const encoderOptions = sizeManifest.encoder.content ? `, { ${sizeManifest.encoder.content} }` : '';
                    const decoderOptions = sizeManifest.decoder.content ? `, { ${sizeManifest.decoder.content} }` : '';

                    return typeManifest({
                        ...mergedManifest,
                        decoder: pipe(
                            mergedManifest.decoder,
                            f => mapFragmentContent(f, c => `getMapDecoder(${c}${decoderOptions})`),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getMapDecoder']),
                        ),
                        encoder: pipe(
                            mergedManifest.encoder,
                            f => mapFragmentContent(f, c => `getMapEncoder(${c}${encoderOptions})`),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getMapEncoder']),
                        ),
                    });
                },

                visitMapValue(node, { self }) {
                    const entryFragments = node.entries.map(entry => visit(entry, self));
                    return mergeTypeManifests(entryFragments, {
                        mergeValues: renders => `new Map([${renders.join(', ')}])`,
                    });
                },

                visitNoneValue() {
                    return typeManifest({
                        value: pipe(fragment('none()'), f => addFragmentImports(f, 'solanaOptions', ['none'])),
                    });
                },

                visitNumberType(numberType) {
                    const encoderFunction = nameApi.encoderFunction(numberType.format);
                    const decoderFunction = nameApi.decoderFunction(numberType.format);
                    const isBigNumber = ['u64', 'u128', 'i64', 'i128'].includes(numberType.format);
                    const encoderImports = new ImportMap().add('solanaCodecsNumbers', encoderFunction);
                    const decoderImports = new ImportMap().add('solanaCodecsNumbers', decoderFunction);
                    let endianness = '';
                    if (numberType.endian === 'be') {
                        encoderImports.add('solanaCodecsNumbers', 'Endian');
                        decoderImports.add('solanaCodecsNumbers', 'Endian');
                        endianness = '{ endian: Endian.Big }';
                    }
                    return typeManifest({
                        decoder: pipe(fragment(`${decoderFunction}(${endianness})`), f =>
                            mergeFragmentImports(f, [decoderImports]),
                        ),
                        encoder: pipe(fragment(`${encoderFunction}(${endianness})`), f =>
                            mergeFragmentImports(f, [encoderImports]),
                        ),
                        looseType: fragment(isBigNumber ? 'number | bigint' : 'number'),
                        strictType: fragment(isBigNumber ? 'bigint' : 'number'),
                    });
                },

                visitNumberValue(node) {
                    return typeManifest({
                        value: fragment(JSON.stringify(node.number)),
                    });
                },

                visitOptionType(optionType, { self }) {
                    const childManifest = visit(optionType.item, self);
                    const encoderOptions: string[] = [];
                    const decoderOptions: string[] = [];
                    const encoderImports = new ImportMap();
                    const decoderImports = new ImportMap();

                    // Prefix option.
                    const optionPrefix = resolveNestedTypeNode(optionType.prefix);
                    if (optionPrefix.format !== 'u8' || optionPrefix.endian !== 'le') {
                        const prefixManifest = visit(optionType.prefix, self);
                        encoderImports.mergeWith(prefixManifest.encoder);
                        decoderImports.mergeWith(prefixManifest.decoder);
                        encoderOptions.push(`prefix: ${prefixManifest.encoder.content}`);
                        decoderOptions.push(`prefix: ${prefixManifest.decoder.content}`);
                    }

                    // Fixed option.
                    if (optionType.fixed) {
                        encoderOptions.push(`noneValue: "zeroes"`);
                        decoderOptions.push(`noneValue: "zeroes"`);
                    }

                    const encoderOptionsAsString =
                        encoderOptions.length > 0 ? `, { ${encoderOptions.join(', ')} }` : '';
                    const decoderOptionsAsString =
                        decoderOptions.length > 0 ? `, { ${decoderOptions.join(', ')} }` : '';

                    return typeManifest({
                        ...childManifest,
                        decoder: pipe(
                            childManifest.decoder,
                            f => mapFragmentContent(f, c => `getOptionDecoder(${c + decoderOptionsAsString})`),
                            f => addFragmentImports(f, 'solanaOptions', ['getOptionDecoder']),
                            f => mergeFragmentImports(f, [decoderImports]),
                        ),
                        encoder: pipe(
                            childManifest.encoder,
                            f => mapFragmentContent(f, c => `getOptionEncoder(${c + encoderOptionsAsString})`),
                            f => addFragmentImports(f, 'solanaOptions', ['getOptionEncoder']),
                            f => mergeFragmentImports(f, [encoderImports]),
                        ),
                        looseType: pipe(
                            childManifest.looseType,
                            f => mapFragmentContent(f, c => `OptionOrNullable<${c}>`),
                            f => addFragmentImports(f, 'solanaOptions', ['type OptionOrNullable']),
                        ),
                        strictType: pipe(
                            childManifest.strictType,
                            f => mapFragmentContent(f, c => `Option<${c}>`),
                            f => addFragmentImports(f, 'solanaOptions', ['type Option']),
                        ),
                    });
                },

                visitPostOffsetType(node, { self }) {
                    const manifest = visit(node.type, self);
                    if (node.strategy === 'padded') {
                        return typeManifest({
                            ...manifest,
                            decoder: pipe(
                                manifest.decoder,
                                f => mapFragmentContent(f, c => `padRightDecoder(${c}, ${node.offset})`),
                                f => addFragmentImports(f, 'solanaCodecsCore', ['padRightDecoder']),
                            ),
                            encoder: pipe(
                                manifest.encoder,
                                f => mapFragmentContent(f, c => `padRightEncoder(${c}, ${node.offset})`),
                                f => addFragmentImports(f, 'solanaCodecsCore', ['padRightEncoder']),
                            ),
                        });
                    }

                    const fn = (() => {
                        switch (node.strategy) {
                            case 'absolute':
                                return node.offset < 0
                                    ? `({ wrapBytes }) => wrapBytes(${node.offset})`
                                    : `() => ${node.offset}`;
                            case 'preOffset':
                                return node.offset < 0
                                    ? `({ preOffset }) => preOffset ${node.offset}`
                                    : `({ preOffset }) => preOffset + ${node.offset}`;
                            case 'relative':
                            default:
                                return node.offset < 0
                                    ? `({ postOffset }) => postOffset ${node.offset}`
                                    : `({ postOffset }) => postOffset + ${node.offset}`;
                        }
                    })();

                    return typeManifest({
                        ...manifest,
                        decoder: pipe(
                            manifest.decoder,
                            f => mapFragmentContent(f, c => `offsetDecoder(${c}, { postOffset: ${fn} })`),
                            f => addFragmentImports(f, 'solanaCodecsCore', ['offsetDecoder']),
                        ),
                        encoder: pipe(
                            manifest.encoder,
                            f => mapFragmentContent(f, c => `offsetEncoder(${c}, { postOffset: ${fn} })`),
                            f => addFragmentImports(f, 'solanaCodecsCore', ['offsetEncoder']),
                        ),
                    });
                },

                visitPreOffsetType(node, { self }) {
                    const manifest = visit(node.type, self);
                    if (node.strategy === 'padded') {
                        return typeManifest({
                            ...manifest,
                            decoder: pipe(
                                manifest.decoder,
                                f => mapFragmentContent(f, c => `padLeftDecoder(${c}, ${node.offset})`),
                                f => addFragmentImports(f, 'solanaCodecsCore', ['padLeftDecoder']),
                            ),
                            encoder: pipe(
                                manifest.encoder,
                                f => mapFragmentContent(f, c => `padLeftEncoder(${c}, ${node.offset})`),
                                f => addFragmentImports(f, 'solanaCodecsCore', ['padLeftEncoder']),
                            ),
                        });
                    }

                    const fn = (() => {
                        switch (node.strategy) {
                            case 'absolute':
                                return node.offset < 0
                                    ? `({ wrapBytes }) => wrapBytes(${node.offset})`
                                    : `() => ${node.offset}`;
                            case 'relative':
                            default:
                                return node.offset < 0
                                    ? `({ preOffset }) => preOffset ${node.offset}`
                                    : `({ preOffset }) => preOffset + ${node.offset}`;
                        }
                    })();

                    return typeManifest({
                        ...manifest,
                        decoder: pipe(
                            manifest.decoder,
                            f => mapFragmentContent(f, c => `offsetDecoder(${c}, { preOffset: ${fn} })`),
                            f => addFragmentImports(f, 'solanaCodecsCore', ['offsetDecoder']),
                        ),
                        encoder: pipe(
                            manifest.encoder,
                            f => mapFragmentContent(f, c => `offsetEncoder(${c}, { preOffset: ${fn} })`),
                            f => addFragmentImports(f, 'solanaCodecsCore', ['offsetEncoder']),
                        ),
                    });
                },

                visitPublicKeyType() {
                    const addressFragment = pipe(fragment('Address'), f =>
                        addFragmentImports(f, 'solanaAddresses', ['type Address']),
                    );
                    return typeManifest({
                        decoder: pipe(fragment('getAddressDecoder()'), f =>
                            addFragmentImports(f, 'solanaAddresses', ['getAddressDecoder']),
                        ),
                        encoder: pipe(fragment('getAddressEncoder()'), f =>
                            addFragmentImports(f, 'solanaAddresses', ['getAddressEncoder']),
                        ),
                        looseType: addressFragment,
                        strictType: addressFragment,
                    });
                },

                visitPublicKeyValue(node) {
                    return typeManifest({
                        value: pipe(fragment(`address("${node.publicKey}")`), f =>
                            addFragmentImports(f, 'solanaAddresses', ['address']),
                        ),
                    });
                },

                visitRemainderOptionType(node, { self }) {
                    const childManifest = visit(node.item, self);
                    const encoderOptions: string[] = ['prefix: null'];
                    const decoderOptions: string[] = ['prefix: null'];

                    const encoderOptionsAsString =
                        encoderOptions.length > 0 ? `, { ${encoderOptions.join(', ')} }` : '';
                    const decoderOptionsAsString =
                        decoderOptions.length > 0 ? `, { ${decoderOptions.join(', ')} }` : '';

                    return typeManifest({
                        ...childManifest,
                        decoder: pipe(
                            childManifest.decoder,
                            f => mapFragmentContent(f, c => `getOptionDecoder(${c + decoderOptionsAsString})`),
                            f => addFragmentImports(f, 'solanaOptions', ['getOptionDecoder']),
                        ),
                        encoder: pipe(
                            childManifest.encoder,
                            f => mapFragmentContent(f, c => `getOptionEncoder(${c + encoderOptionsAsString})`),
                            f => addFragmentImports(f, 'solanaOptions', ['getOptionEncoder']),
                        ),
                        looseType: pipe(
                            childManifest.looseType,
                            f => mapFragmentContent(f, c => `OptionOrNullable<${c}>`),
                            f => addFragmentImports(f, 'solanaOptions', ['type OptionOrNullable']),
                        ),
                        strictType: pipe(
                            childManifest.strictType,
                            f => mapFragmentContent(f, c => `Option<${c}>`),
                            f => addFragmentImports(f, 'solanaOptions', ['type Option']),
                        ),
                    });
                },

                visitSentinelType(node, { self }) {
                    const manifest = visit(node.type, self);
                    const sentinel = visit(node.sentinel, self).value;
                    return typeManifest({
                        ...manifest,
                        decoder: pipe(
                            mergeFragments(
                                [manifest.decoder, sentinel],
                                ([child, sentinel]) => `addDecoderSentinel(${child}, ${sentinel})`,
                            ),
                            f => addFragmentImports(f, 'solanaCodecsCore', ['addDecoderSentinel']),
                        ),
                        encoder: pipe(
                            mergeFragments(
                                [manifest.encoder, sentinel],
                                ([child, sentinel]) => `addEncoderSentinel(${child}, ${sentinel})`,
                            ),
                            f => addFragmentImports(f, 'solanaCodecsCore', ['addEncoderSentinel']),
                        ),
                    });
                },

                visitSetType(setType, { self }) {
                    const childManifest = visit(setType.item, self);
                    const sizeManifest = getArrayLikeSizeOption(setType.count, self);
                    const encoderOptions = sizeManifest.encoder.content ? `, { ${sizeManifest.encoder.content} }` : '';
                    const decoderOptions = sizeManifest.decoder.content ? `, { ${sizeManifest.decoder.content} }` : '';

                    return typeManifest({
                        ...childManifest,
                        decoder: pipe(
                            childManifest.decoder,
                            f => mapFragmentContent(f, c => `getSetDecoder(${c + decoderOptions})`),
                            f => mergeFragmentImports(f, [sizeManifest.decoder.imports]),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getSetDecoder']),
                        ),
                        encoder: pipe(
                            childManifest.encoder,
                            f => mapFragmentContent(f, c => `getSetEncoder(${c + encoderOptions})`),
                            f => mergeFragmentImports(f, [sizeManifest.encoder.imports]),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getSetEncoder']),
                        ),
                        looseType: pipe(childManifest.looseType, f => mapFragmentContent(f, c => `Set<${c}>`)),
                        strictType: pipe(childManifest.strictType, f => mapFragmentContent(f, c => `Set<${c}>`)),
                    });
                },

                visitSetValue(node, { self }) {
                    return mergeTypeManifests(
                        node.items.map(v => visit(v, self)),
                        { mergeValues: renders => `new Set([${renders.join(', ')}])` },
                    );
                },

                visitSizePrefixType(node, { self }) {
                    const manifest = visit(node.type, self);
                    const prefix = visit(node.prefix, self);

                    return typeManifest({
                        ...manifest,
                        decoder: pipe(
                            mergeFragments(
                                [manifest.decoder, prefix.decoder],
                                ([decoder, prefix]) => `addDecoderSizePrefix(${decoder}, ${prefix})`,
                            ),
                            f => addFragmentImports(f, 'solanaCodecsCore', ['addDecoderSizePrefix']),
                        ),
                        encoder: pipe(
                            mergeFragments(
                                [manifest.encoder, prefix.encoder],
                                ([encoder, prefix]) => `addEncoderSizePrefix(${encoder}, ${prefix})`,
                            ),
                            f => addFragmentImports(f, 'solanaCodecsCore', ['addEncoderSizePrefix']),
                        ),
                    });
                },

                visitSolAmountType({ number }, { self }) {
                    const numberManifest = visit(number, self);
                    const lamportFragment = pipe(fragment('Lamports'), f =>
                        addFragmentImports(f, 'solanaRpcTypes', ['type Lamports']),
                    );

                    return typeManifest({
                        ...numberManifest,
                        decoder: pipe(
                            numberManifest.decoder,
                            f => mapFragmentContent(f, c => `getLamportsDecoder(${c})`),
                            f => addFragmentImports(f, 'solanaRpcTypes', ['getLamportsDecoder']),
                        ),
                        encoder: pipe(
                            numberManifest.encoder,
                            f => mapFragmentContent(f, c => `getLamportsEncoder(${c})`),
                            f => addFragmentImports(f, 'solanaRpcTypes', ['getLamportsEncoder']),
                        ),
                        looseType: lamportFragment,
                        strictType: lamportFragment,
                    });
                },

                visitSomeValue(node, { self }) {
                    return typeManifest({
                        value: pipe(
                            visit(node.value, self).value,
                            f => mapFragmentContent(f, c => `some(${c})`),
                            f => addFragmentImports(f, 'solanaOptions', ['some']),
                        ),
                    });
                },

                visitStringType(stringType) {
                    const [encoder, decoder] = (() => {
                        switch (stringType.encoding) {
                            case 'base16':
                                return ['getBase16Encoder', 'getBase16Decoder'];
                            case 'base58':
                                return ['getBase58Encoder', 'getBase58Decoder'];
                            case 'base64':
                                return ['getBase64Encoder', 'getBase64Decoder'];
                            case 'utf8':
                                return ['getUtf8Encoder', 'getUtf8Decoder'];
                            default:
                                throw new Error(`Unsupported string encoding: ${stringType.encoding as string}`);
                        }
                    })();

                    return typeManifest({
                        decoder: pipe(fragment(`${decoder}()`), f =>
                            addFragmentImports(f, 'solanaCodecsStrings', [decoder]),
                        ),
                        encoder: pipe(fragment(`${encoder}()`), f =>
                            addFragmentImports(f, 'solanaCodecsStrings', [encoder]),
                        ),
                        looseType: fragment('string'),
                        strictType: fragment('string'),
                    });
                },

                visitStringValue(node) {
                    return typeManifest({
                        value: fragment(JSON.stringify(node.string)),
                    });
                },

                visitStructFieldType(structFieldType, { self }) {
                    const name = camelCase(structFieldType.name);
                    const originalChildManifest = visit(structFieldType.type, self);
                    const structFieldDocs = parseDocs(structFieldType.docs);
                    const docblock = structFieldDocs.length > 0 ? `\n${jsDocblock(structFieldDocs)}` : '';
                    const originalLooseType = originalChildManifest.looseType.content;
                    const childManifest = typeManifest({
                        ...originalChildManifest,
                        decoder: pipe(originalChildManifest.decoder, f =>
                            mapFragmentContent(f, c => `['${name}', ${c}]`),
                        ),
                        encoder: pipe(originalChildManifest.encoder, f =>
                            mapFragmentContent(f, c => `['${name}', ${c}]`),
                        ),
                        looseType: pipe(originalChildManifest.looseType, f =>
                            mapFragmentContent(f, c => `${docblock}${name}: ${c}; `),
                        ),
                        strictType: pipe(originalChildManifest.strictType, f =>
                            mapFragmentContent(f, c => `${docblock}${name}: ${c}; `),
                        ),
                    });

                    // No default value.
                    if (!structFieldType.defaultValue) {
                        return childManifest;
                    }

                    // Optional default value.
                    if (structFieldType.defaultValueStrategy !== 'omitted') {
                        return typeManifest({
                            ...childManifest,
                            looseType: pipe(childManifest.looseType, f =>
                                setFragmentContent(f, `${docblock}${name}?: ${originalLooseType}; `),
                            ),
                        });
                    }

                    // Omitted default value.
                    return typeManifest({
                        ...childManifest,
                        looseType: fragment(''),
                    });
                },

                visitStructFieldValue(node, { self }) {
                    return typeManifest({
                        value: pipe(visit(node.value, self).value, f =>
                            mapFragmentContent(f, c => `${node.name}: ${c}`),
                        ),
                    });
                },

                visitStructType(structType, { self }) {
                    const optionalFields = structType.fields.filter(f => !!f.defaultValue);

                    const mergedManifest = pipe(
                        mergeTypeManifests(
                            structType.fields.map(field => visit(field, self)),
                            {
                                mergeCodecs: renders => `([${renders.join(', ')}])`,
                                mergeTypes: renders => `{ ${renders.join('')} }`,
                            },
                        ),
                        manifest =>
                            typeManifest({
                                ...manifest,
                                decoder: pipe(
                                    manifest.decoder,
                                    f => mapFragmentContent(f, c => `getStructDecoder${c}`),
                                    f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getStructDecoder']),
                                ),
                                encoder: pipe(
                                    manifest.encoder,
                                    f => mapFragmentContent(f, c => `getStructEncoder${c}`),
                                    f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getStructEncoder']),
                                ),
                            }),
                    );

                    if (optionalFields.length === 0) {
                        return mergedManifest;
                    }

                    // Check if we are inside an instruction or account to use discriminator constants when available.
                    const parentPath = stack.getPath();
                    const instructionNode = findLastNodeFromPath(parentPath, 'instructionNode');
                    const accountNode = findLastNodeFromPath(parentPath, 'accountNode');
                    const discriminatorPrefix = instructionNode ? instructionNode.name : accountNode?.name;
                    const discriminators =
                        (instructionNode ? instructionNode.discriminators : accountNode?.discriminators) ?? [];
                    const fieldDiscriminators = discriminators.filter(isNodeFilter('fieldDiscriminatorNode'));
                    const encoderImports = new ImportMap();

                    const defaultValues = optionalFields
                        .map(f => {
                            const key = camelCase(f.name);

                            // If the field has an associated discriminator node, use the constant value instead.
                            if (fieldDiscriminators.some(d => d.name === f.name)) {
                                const constantName = nameApi.constant(camelCase(`${discriminatorPrefix}_${f.name}`));
                                return f.defaultValueStrategy === 'omitted'
                                    ? `${key}: ${constantName}`
                                    : `${key}: value.${key} ?? ${constantName}`;
                            }

                            const defaultValue = f.defaultValue as NonNullable<typeof f.defaultValue>;
                            const { content: renderedValue, imports } = visit(defaultValue, self).value;
                            encoderImports.mergeWith(imports);
                            return f.defaultValueStrategy === 'omitted'
                                ? `${key}: ${renderedValue}`
                                : `${key}: value.${key} ?? ${renderedValue}`;
                        })
                        .join(', ');

                    return typeManifest({
                        ...mergedManifest,
                        encoder: pipe(
                            mergedManifest.encoder,
                            f =>
                                mapFragmentContent(
                                    f,
                                    c => `transformEncoder(${c}, (value) => ({ ...value, ${defaultValues} }))`,
                                ),
                            f => addFragmentImports(f, 'solanaCodecsCore', ['transformEncoder']),
                            f => mergeFragmentImports(f, [encoderImports]),
                        ),
                    });
                },

                visitStructValue(node, { self }) {
                    return mergeTypeManifests(
                        node.fields.map(field => visit(field, self)),
                        { mergeValues: renders => `{ ${renders.join(', ')} }` },
                    );
                },

                visitTupleType(tupleType, { self }) {
                    const items = tupleType.items.map(item => visit(item, self));
                    const mergedManifest = mergeTypeManifests(items, {
                        mergeCodecs: codecs => `[${codecs.join(', ')}]`,
                        mergeTypes: types => `readonly [${types.join(', ')}]`,
                    });

                    return typeManifest({
                        ...mergedManifest,
                        decoder: pipe(
                            mergedManifest.decoder,
                            f => mapFragmentContent(f, c => `getTupleDecoder(${c})`),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getTupleDecoder']),
                        ),
                        encoder: pipe(
                            mergedManifest.encoder,
                            f => mapFragmentContent(f, c => `getTupleEncoder(${c})`),
                            f => addFragmentImports(f, 'solanaCodecsDataStructures', ['getTupleEncoder']),
                        ),
                    });
                },

                visitTupleValue(node, { self }) {
                    return mergeTypeManifests(
                        node.items.map(v => visit(v, self)),
                        { mergeValues: renders => `[${renders.join(', ')}]` },
                    );
                },

                visitZeroableOptionType(node, { self }) {
                    const childManifest = visit(node.item, self);
                    const encoderOptions: string[] = ['prefix: null'];
                    const decoderOptions: string[] = ['prefix: null'];
                    const encoderImports = new ImportMap();
                    const decoderImports = new ImportMap();

                    // Zero-value option.
                    if (node.zeroValue) {
                        const zeroValueManifest = visit(node.zeroValue, self);
                        encoderImports.mergeWith(zeroValueManifest.value);
                        decoderImports.mergeWith(zeroValueManifest.value);
                        encoderOptions.push(`noneValue: ${zeroValueManifest.value.content}`);
                        decoderOptions.push(`noneValue: ${zeroValueManifest.value.content}`);
                    } else {
                        encoderOptions.push(`noneValue: "zeroes"`);
                        decoderOptions.push(`noneValue: "zeroes"`);
                    }

                    const encoderOptionsAsString =
                        encoderOptions.length > 0 ? `, { ${encoderOptions.join(', ')} }` : '';
                    const decoderOptionsAsString =
                        decoderOptions.length > 0 ? `, { ${decoderOptions.join(', ')} }` : '';

                    return typeManifest({
                        ...childManifest,
                        decoder: pipe(
                            childManifest.decoder,
                            f => mapFragmentContent(f, c => `getOptionDecoder(${c + decoderOptionsAsString})`),
                            f => addFragmentImports(f, 'solanaOptions', ['getOptionDecoder']),
                            f => mergeFragmentImports(f, [decoderImports]),
                        ),
                        encoder: pipe(
                            childManifest.encoder,
                            f => mapFragmentContent(f, c => `getOptionEncoder(${c + encoderOptionsAsString})`),
                            f => addFragmentImports(f, 'solanaOptions', ['getOptionEncoder']),
                            f => mergeFragmentImports(f, [encoderImports]),
                        ),
                        looseType: pipe(
                            childManifest.looseType,
                            f => mapFragmentContent(f, c => `OptionOrNullable<${c}>`),
                            f => addFragmentImports(f, 'solanaOptions', ['type OptionOrNullable']),
                        ),
                        strictType: pipe(
                            childManifest.strictType,
                            f => mapFragmentContent(f, c => `Option<${c}>`),
                            f => addFragmentImports(f, 'solanaOptions', ['type Option']),
                        ),
                    });
                },
            }),
        visitor => recordNodeStackVisitor(visitor, stack),
    );
}

function getArrayLikeSizeOption(
    count: CountNode,
    visitor: Visitor<TypeManifest, TypeNode['kind']>,
): {
    decoder: Fragment;
    encoder: Fragment;
} {
    if (isNode(count, 'fixedCountNode')) {
        return {
            decoder: fragment(`size: ${count.value}`),
            encoder: fragment(`size: ${count.value}`),
        };
    }
    if (isNode(count, 'remainderCountNode')) {
        return {
            decoder: fragment(`size: 'remainder'`),
            encoder: fragment(`size: 'remainder'`),
        };
    }
    const prefix = resolveNestedTypeNode(count.prefix);
    if (prefix.format === 'u32' && prefix.endian === 'le') {
        return { decoder: fragment(''), encoder: fragment('') };
    }
    const prefixManifest = visit(count.prefix, visitor);
    return {
        decoder: pipe(prefixManifest.decoder, f => mapFragmentContent(f, c => `size: ${c}`)),
        encoder: pipe(prefixManifest.encoder, f => mapFragmentContent(f, c => `size: ${c}`)),
    };
}
