import {
    camelCase,
    CamelCaseString,
    CountNode,
    isNode,
    isScalarEnum,
    REGISTERED_TYPE_NODE_KINDS,
    REGISTERED_VALUE_NODE_KINDS,
    resolveNestedTypeNode,
    structFieldTypeNode,
    structTypeNode,
    structTypeNodeFromInstructionArgumentNodes,
    TypeNode,
} from '@kinobi-so/nodes';
import { extendVisitor, LinkableDictionary, pipe, staticVisitor, visit, Visitor } from '@kinobi-so/visitors-core';

import { Fragment, fragment, mergeFragments } from './fragments';
import { ImportMap } from './ImportMap';
import { NameApi } from './nameTransformers';
import { mergeManifests, TypeManifest, typeManifest } from './TypeManifest';
import { getBytesFromBytesValueNode, jsDocblock, ParsedCustomDataOptions } from './utils';

export type TypeManifestVisitor = ReturnType<typeof getTypeManifestVisitor>;

export function getTypeManifestVisitor(input: {
    customAccountData: ParsedCustomDataOptions;
    customInstructionData: ParsedCustomDataOptions;
    linkables: LinkableDictionary;
    nameApi: NameApi;
    nonScalarEnums: CamelCaseString[];
    parentName?: { loose: string; strict: string };
}) {
    const { nameApi, linkables, nonScalarEnums, customAccountData, customInstructionData } = input;
    let parentName = input.parentName ?? null;

    return pipe(
        staticVisitor(
            () =>
                ({
                    defaultValues: fragment(''),
                    decoder: fragment(''),
                    encoder: fragment(''),
                    isEnum: false,
                    looseType: fragment(''),
                    strictType: fragment(''),
                    value: fragment(''),
                }) as TypeManifest,
            [
                ...REGISTERED_TYPE_NODE_KINDS,
                ...REGISTERED_VALUE_NODE_KINDS,
                'definedTypeLinkNode',
                'definedTypeNode',
                'accountNode',
                'instructionNode',
            ],
        ),
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
                    childManifest.looseType.mapRender(r => `Array<${r}>`);
                    childManifest.strictType.mapRender(r => `Array<${r}>`);
                    const sizeManifest = getArrayLikeSizeOption(arrayType.count, self);
                    const encoderOptions = sizeManifest.encoder.render ? `, { ${sizeManifest.encoder.render} }` : '';
                    const decoderOptions = sizeManifest.decoder.render ? `, { ${sizeManifest.decoder.render} }` : '';
                    childManifest.encoder
                        .mapRender(r => `getArrayEncoder(${r + encoderOptions})`)
                        .mergeImportsWith(sizeManifest.encoder)
                        .addImports('solanaCodecsDataStructures', 'getArrayEncoder');
                    childManifest.decoder
                        .mapRender(r => `getArrayDecoder(${r + decoderOptions})`)
                        .mergeImportsWith(sizeManifest.decoder)
                        .addImports('solanaCodecsDataStructures', 'getArrayDecoder');
                    return childManifest;
                },

                visitArrayValue(node, { self }) {
                    return mergeManifests(
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
                        sizeEncoder = `{ size: ${size.encoder.render} }`;
                        sizeDecoder = `{ size: ${size.decoder.render} }`;
                    }

                    return {
                        defaultValues: fragment(''),
                        decoder: fragment(`getBooleanDecoder(${sizeDecoder})`, decoderImports),
                        encoder: fragment(`getBooleanEncoder(${sizeEncoder})`, encoderImports),
                        isEnum: false,
                        looseType: fragment('boolean'),
                        strictType: fragment('boolean'),
                        value: fragment(''),
                    };
                },

                visitBooleanValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(JSON.stringify(node.boolean));
                    return manifest;
                },

                visitBytesType() {
                    return {
                        defaultValues: fragment(''),
                        decoder: fragment(`getBytesDecoder()`).addImports(
                            'solanaCodecsDataStructures',
                            'getBytesDecoder',
                        ),
                        encoder: fragment(`getBytesEncoder()`).addImports(
                            'solanaCodecsDataStructures',
                            'getBytesEncoder',
                        ),
                        isEnum: false,
                        looseType: fragment('ReadonlyUint8Array').addImports(
                            'solanaCodecsCore',
                            'type ReadonlyUint8Array',
                        ),
                        strictType: fragment('ReadonlyUint8Array').addImports(
                            'solanaCodecsCore',
                            'type ReadonlyUint8Array',
                        ),
                        value: fragment(''),
                    };
                },

                visitBytesValue(node) {
                    const manifest = typeManifest();
                    const bytes = getBytesFromBytesValueNode(node);
                    manifest.value.setRender(`new Uint8Array([${Array.from(bytes).join(', ')}])`);
                    return manifest;
                },

                visitConstantValue(node, { self }) {
                    if (isNode(node.type, 'bytesTypeNode') && isNode(node.value, 'bytesValueNode')) {
                        return visit(node.value, self);
                    }
                    return {
                        ...typeManifest(),
                        value: mergeFragments(
                            [visit(node.type, self).encoder, visit(node.value, self).value],
                            ([encoderFunction, value]) => `${encoderFunction}.encode(${value})`,
                        ),
                    };
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
                    const importFrom = node.importFrom ?? 'generatedTypes';

                    return {
                        defaultValues: fragment(''),
                        decoder: fragment(`${decoderFunction}()`).addImports(importFrom, decoderFunction),
                        encoder: fragment(`${encoderFunction}()`).addImports(importFrom, encoderFunction),
                        isEnum: false,
                        looseType: fragment(looseName).addImports(importFrom, `type ${looseName}`),
                        strictType: fragment(strictName).addImports(importFrom, `type ${strictName}`),
                        value: fragment(''),
                    };
                },

                visitEnumEmptyVariantType(enumEmptyVariantType) {
                    const discriminator = nameApi.discriminatedUnionDiscriminator(camelCase(parentName?.strict ?? ''));
                    const name = nameApi.discriminatedUnionVariant(enumEmptyVariantType.name);
                    const kindAttribute = `${discriminator}: "${name}"`;
                    return {
                        defaultValues: fragment(''),
                        decoder: fragment(`['${name}', getUnitDecoder()]`).addImports(
                            'solanaCodecsDataStructures',
                            'getUnitDecoder',
                        ),
                        encoder: fragment(`['${name}', getUnitEncoder()]`).addImports(
                            'solanaCodecsDataStructures',
                            'getUnitEncoder',
                        ),
                        isEnum: false,
                        looseType: fragment(`{ ${kindAttribute} }`),
                        strictType: fragment(`{ ${kindAttribute} }`),
                        value: fragment(''),
                    };
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

                    structManifest.strictType.mapRender(r => `{ ${kindAttribute},${r.slice(1, -1)}}`);
                    structManifest.looseType.mapRender(r => `{ ${kindAttribute},${r.slice(1, -1)}}`);
                    structManifest.encoder.mapRender(r => `['${name}', ${r}]`);
                    structManifest.decoder.mapRender(r => `['${name}', ${r}]`);
                    return structManifest;
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

                    structManifest.strictType.mapRender(r => `{ ${kindAttribute},${r.slice(1, -1)}}`);
                    structManifest.looseType.mapRender(r => `{ ${kindAttribute},${r.slice(1, -1)}}`);
                    structManifest.encoder.mapRender(r => `['${name}', ${r}]`);
                    structManifest.decoder.mapRender(r => `['${name}', ${r}]`);
                    return structManifest;
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
                        encoderOptions.push(`size: ${sizeManifest.encoder.render}`);
                        decoderOptions.push(`size: ${sizeManifest.decoder.render}`);
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
                        return {
                            defaultValues: fragment(''),
                            decoder: fragment(
                                `getEnumDecoder(${currentParentName.strict + decoderOptionsAsString})`,
                                decoderImports.add('solanaCodecsDataStructures', 'getEnumDecoder'),
                            ),
                            encoder: fragment(
                                `getEnumEncoder(${currentParentName.strict + encoderOptionsAsString})`,
                                encoderImports.add('solanaCodecsDataStructures', 'getEnumEncoder'),
                            ),
                            isEnum: true,
                            looseType: fragment(`{ ${variantNames.join(', ')} }`),
                            strictType: fragment(`{ ${variantNames.join(', ')} }`),
                            value: fragment(''),
                        };
                    }

                    const mergedManifest = mergeManifests(
                        enumType.variants.map(variant => visit(variant, self)),
                        {
                            mergeCodecs: renders => renders.join(', '),
                            mergeTypes: renders => renders.join(' | '),
                        },
                    );
                    mergedManifest.encoder
                        .mapRender(r => `getDiscriminatedUnionEncoder([${r}]${encoderOptionsAsString})`)
                        .mergeImportsWith(encoderImports)
                        .addImports('solanaCodecsDataStructures', ['getDiscriminatedUnionEncoder']);
                    mergedManifest.decoder
                        .mapRender(r => `getDiscriminatedUnionDecoder([${r}]${decoderOptionsAsString})`)
                        .mergeImportsWith(decoderImports)
                        .addImports('solanaCodecsDataStructures', ['getDiscriminatedUnionDecoder']);
                    return mergedManifest;
                },

                visitEnumValue(node, { self }) {
                    const manifest = typeManifest();
                    const enumName = nameApi.dataType(node.enum.name);
                    const enumFunction = nameApi.discriminatedUnionFunction(node.enum.name);
                    const importFrom = node.enum.importFrom ?? 'generatedTypes';

                    const enumNode = linkables.get(node.enum)?.type;
                    const isScalar =
                        enumNode && isNode(enumNode, 'enumTypeNode')
                            ? isScalarEnum(enumNode)
                            : !nonScalarEnums.includes(node.enum.name);

                    if (!node.value && isScalar) {
                        const variantName = nameApi.enumVariant(node.variant);
                        manifest.value.setRender(`${enumName}.${variantName}`).addImports(importFrom, enumName);
                        return manifest;
                    }

                    const variantName = nameApi.discriminatedUnionVariant(node.variant);
                    if (!node.value) {
                        manifest.value
                            .setRender(`${enumFunction}('${variantName}')`)
                            .addImports(importFrom, enumFunction);
                        return manifest;
                    }

                    manifest.value = visit(node.value, self)
                        .value.mapRender(r => `${enumFunction}('${variantName}', ${r})`)
                        .addImports(importFrom, enumFunction);
                    return manifest;
                },

                visitFixedSizeType(node, { self }) {
                    const manifest = visit(node.type, self);
                    manifest.encoder
                        .mapRender(r => `fixEncoderSize(${r}, ${node.size})`)
                        .addImports('solanaCodecsCore', 'fixEncoderSize');
                    manifest.decoder
                        .mapRender(r => `fixDecoderSize(${r}, ${node.size})`)
                        .addImports('solanaCodecsCore', 'fixDecoderSize');
                    return manifest;
                },

                visitHiddenPrefixType(node, { self }) {
                    const manifest = visit(node.type, self);
                    const prefixes = node.prefix.map(c => visit(c, self).value);
                    const prefixEncoders = fragment(prefixes.map(c => `getConstantEncoder(${c})`).join(', '))
                        .addImports('solanaCodecsCore', 'getConstantEncoder')
                        .mergeImportsWith(...prefixes);
                    const prefixDecoders = fragment(prefixes.map(c => `getConstantDecoder(${c})`).join(', '))
                        .addImports('solanaCodecsCore', 'getConstantDecoder')
                        .mergeImportsWith(...prefixes);
                    manifest.encoder
                        .mapRender(r => `getHiddenPrefixEncoder(${r}, [${prefixEncoders}])`)
                        .mergeImportsWith(prefixEncoders)
                        .addImports('solanaCodecsDataStructures', 'getHiddenPrefixEncoder');
                    manifest.decoder
                        .mapRender(r => `getHiddenPrefixDecoder(${r}, [${prefixDecoders}])`)
                        .mergeImportsWith(prefixDecoders)
                        .addImports('solanaCodecsDataStructures', 'getHiddenPrefixDecoder');
                    return manifest;
                },

                visitHiddenSuffixType(node, { self }) {
                    const manifest = visit(node.type, self);
                    const suffixes = node.suffix.map(c => visit(c, self).value);
                    const suffixEncoders = fragment(suffixes.map(c => `getConstantEncoder(${c})`).join(', '))
                        .addImports('solanaCodecsCore', 'getConstantEncoder')
                        .mergeImportsWith(...suffixes);
                    const suffixDecoders = fragment(suffixes.map(c => `getConstantDecoder(${c})`).join(', '))
                        .addImports('solanaCodecsCore', 'getConstantDecoder')
                        .mergeImportsWith(...suffixes);
                    manifest.encoder
                        .mapRender(r => `getHiddenSuffixEncoder(${r}, [${suffixEncoders}])`)
                        .mergeImportsWith(suffixEncoders)
                        .addImports('solanaCodecsDataStructures', 'getHiddenSuffixEncoder');
                    manifest.decoder
                        .mapRender(r => `getHiddenSuffixDecoder(${r}, [${suffixDecoders}])`)
                        .mergeImportsWith(suffixDecoders)
                        .addImports('solanaCodecsDataStructures', 'getHiddenSuffixDecoder');
                    return manifest;
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
                    return mergeManifests([visit(node.key, self), visit(node.value, self)], {
                        mergeValues: renders => `[${renders.join(', ')}]`,
                    });
                },

                visitMapType(mapType, { self }) {
                    const key = visit(mapType.key, self);
                    const value = visit(mapType.value, self);
                    const mergedManifest = mergeManifests([key, value], {
                        mergeCodecs: ([k, v]) => `${k}, ${v}`,
                        mergeTypes: ([k, v]) => `Map<${k}, ${v}>`,
                    });
                    const sizeManifest = getArrayLikeSizeOption(mapType.count, self);
                    const encoderOptions = sizeManifest.encoder.render ? `, { ${sizeManifest.encoder.render} }` : '';
                    const decoderOptions = sizeManifest.decoder.render ? `, { ${sizeManifest.decoder.render} }` : '';
                    mergedManifest.encoder
                        .mapRender(r => `getMapEncoder(${r}${encoderOptions})`)
                        .addImports('solanaCodecsDataStructures', 'getMapEncoder');
                    mergedManifest.decoder
                        .mapRender(r => `getMapDecoder(${r}${decoderOptions})`)
                        .addImports('solanaCodecsDataStructures', 'getMapDecoder');
                    return mergedManifest;
                },

                visitMapValue(node, { self }) {
                    const entryFragments = node.entries.map(entry => visit(entry, self));
                    return mergeManifests(entryFragments, {
                        mergeValues: renders => `new Map([${renders.join(', ')}])`,
                    });
                },

                visitNoneValue() {
                    const manifest = typeManifest();
                    manifest.value.setRender('none()').addImports('solanaOptions', 'none');
                    return manifest;
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
                    return {
                        defaultValues: fragment(''),
                        decoder: fragment(`${decoderFunction}(${endianness})`, decoderImports),
                        encoder: fragment(`${encoderFunction}(${endianness})`, encoderImports),
                        isEnum: false,
                        looseType: fragment(isBigNumber ? 'number | bigint' : 'number'),
                        strictType: fragment(isBigNumber ? 'bigint' : 'number'),
                        value: fragment(''),
                    };
                },

                visitNumberValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(JSON.stringify(node.number));
                    return manifest;
                },

                visitOptionType(optionType, { self }) {
                    const childManifest = visit(optionType.item, self);
                    childManifest.strictType.mapRender(r => `Option<${r}>`).addImports('solanaOptions', 'type Option');
                    childManifest.looseType
                        .mapRender(r => `OptionOrNullable<${r}>`)
                        .addImports('solanaOptions', 'type OptionOrNullable');
                    const encoderOptions: string[] = [];
                    const decoderOptions: string[] = [];

                    // Prefix option.
                    const optionPrefix = resolveNestedTypeNode(optionType.prefix);
                    if (optionPrefix.format !== 'u8' || optionPrefix.endian !== 'le') {
                        const prefixManifest = visit(optionType.prefix, self);
                        childManifest.encoder.mergeImportsWith(prefixManifest.encoder);
                        childManifest.decoder.mergeImportsWith(prefixManifest.decoder);
                        encoderOptions.push(`prefix: ${prefixManifest.encoder.render}`);
                        decoderOptions.push(`prefix: ${prefixManifest.decoder.render}`);
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
                    childManifest.encoder
                        .mapRender(r => `getOptionEncoder(${r + encoderOptionsAsString})`)
                        .addImports('solanaOptions', 'getOptionEncoder');
                    childManifest.decoder
                        .mapRender(r => `getOptionDecoder(${r + decoderOptionsAsString})`)
                        .addImports('solanaOptions', 'getOptionDecoder');
                    return childManifest;
                },

                visitPostOffsetType(node, { self }) {
                    const manifest = visit(node.type, self);
                    if (node.strategy === 'padded') {
                        manifest.encoder
                            .mapRender(r => `padRightEncoder(${r}, ${node.offset})`)
                            .addImports('solanaCodecsCore', 'padRightEncoder');
                        manifest.decoder
                            .mapRender(r => `padRightDecoder(${r}, ${node.offset})`)
                            .addImports('solanaCodecsCore', 'padRightDecoder');
                        return manifest;
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
                    manifest.encoder
                        .mapRender(r => `offsetEncoder(${r}, { postOffset: ${fn} })`)
                        .addImports('solanaCodecsCore', 'offsetEncoder');
                    manifest.decoder
                        .mapRender(r => `offsetDecoder(${r}, { postOffset: ${fn} })`)
                        .addImports('solanaCodecsCore', 'offsetDecoder');
                    return manifest;
                },

                visitPreOffsetType(node, { self }) {
                    const manifest = visit(node.type, self);
                    if (node.strategy === 'padded') {
                        manifest.encoder
                            .mapRender(r => `padLeftEncoder(${r}, ${node.offset})`)
                            .addImports('solanaCodecsCore', 'padLeftEncoder');
                        manifest.decoder
                            .mapRender(r => `padLeftDecoder(${r}, ${node.offset})`)
                            .addImports('solanaCodecsCore', 'padLeftDecoder');
                        return manifest;
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
                    manifest.encoder
                        .mapRender(r => `offsetEncoder(${r}, { preOffset: ${fn} })`)
                        .addImports('solanaCodecsCore', 'offsetEncoder');
                    manifest.decoder
                        .mapRender(r => `offsetDecoder(${r}, { preOffset: ${fn} })`)
                        .addImports('solanaCodecsCore', 'offsetDecoder');
                    return manifest;
                },

                visitPublicKeyType() {
                    const imports = new ImportMap().add('solanaAddresses', 'type Address');
                    return {
                        defaultValues: fragment(''),
                        decoder: fragment('getAddressDecoder()').addImports('solanaAddresses', 'getAddressDecoder'),
                        encoder: fragment('getAddressEncoder()').addImports('solanaAddresses', 'getAddressEncoder'),
                        isEnum: false,
                        looseType: fragment('Address', imports),
                        strictType: fragment('Address', imports),
                        value: fragment(''),
                    };
                },

                visitPublicKeyValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(`address("${node.publicKey}")`).addImports('solanaAddresses', 'address');
                    return manifest;
                },

                visitRemainderOptionType(node, { self }) {
                    const childManifest = visit(node.item, self);
                    childManifest.strictType.mapRender(r => `Option<${r}>`).addImports('solanaOptions', 'type Option');
                    childManifest.looseType
                        .mapRender(r => `OptionOrNullable<${r}>`)
                        .addImports('solanaOptions', 'type OptionOrNullable');
                    const encoderOptions: string[] = ['prefix: null'];
                    const decoderOptions: string[] = ['prefix: null'];

                    const encoderOptionsAsString =
                        encoderOptions.length > 0 ? `, { ${encoderOptions.join(', ')} }` : '';
                    const decoderOptionsAsString =
                        decoderOptions.length > 0 ? `, { ${decoderOptions.join(', ')} }` : '';
                    childManifest.encoder
                        .mapRender(r => `getOptionEncoder(${r + encoderOptionsAsString})`)
                        .addImports('solanaOptions', 'getOptionEncoder');
                    childManifest.decoder
                        .mapRender(r => `getOptionDecoder(${r + decoderOptionsAsString})`)
                        .addImports('solanaOptions', 'getOptionDecoder');
                    return childManifest;
                },

                visitSentinelType(node, { self }) {
                    const manifest = visit(node.type, self);
                    const sentinel = visit(node.sentinel, self).value;
                    manifest.encoder
                        .mapRender(r => `addEncoderSentinel(${r}, ${sentinel})`)
                        .mergeImportsWith(sentinel)
                        .addImports('solanaCodecsCore', 'addEncoderSentinel');
                    manifest.decoder
                        .mapRender(r => `addDecoderSentinel(${r}, ${sentinel})`)
                        .mergeImportsWith(sentinel)
                        .addImports('solanaCodecsCore', 'addDecoderSentinel');
                    return manifest;
                },

                visitSetType(setType, { self }) {
                    const childManifest = visit(setType.item, self);
                    childManifest.strictType.mapRender(r => `Set<${r}>`);
                    childManifest.looseType.mapRender(r => `Set<${r}>`);

                    const sizeManifest = getArrayLikeSizeOption(setType.count, self);
                    const encoderOptions = sizeManifest.encoder.render ? `, { ${sizeManifest.encoder.render} }` : '';
                    const decoderOptions = sizeManifest.decoder.render ? `, { ${sizeManifest.decoder.render} }` : '';
                    childManifest.encoder
                        .mergeImportsWith(sizeManifest.encoder)
                        .mapRender(r => `getSetEncoder(${r + encoderOptions})`)
                        .addImports('solanaCodecsDataStructures', 'getSetEncoder');
                    childManifest.decoder
                        .mergeImportsWith(sizeManifest.decoder)
                        .mapRender(r => `getSetDecoder(${r + decoderOptions})`)
                        .addImports('solanaCodecsDataStructures', 'getSetDecoder');

                    return childManifest;
                },

                visitSetValue(node, { self }) {
                    return mergeManifests(
                        node.items.map(v => visit(v, self)),
                        { mergeValues: renders => `new Set([${renders.join(', ')}])` },
                    );
                },

                visitSizePrefixType(node, { self }) {
                    const manifest = visit(node.type, self);
                    const prefix = visit(node.prefix, self);
                    manifest.encoder
                        .mapRender(r => `addEncoderSizePrefix(${r}, ${prefix.encoder})`)
                        .mergeImportsWith(prefix.encoder)
                        .addImports('solanaCodecsCore', 'addEncoderSizePrefix');
                    manifest.decoder
                        .mapRender(r => `addDecoderSizePrefix(${r}, ${prefix.decoder})`)
                        .mergeImportsWith(prefix.decoder)
                        .addImports('solanaCodecsCore', 'addDecoderSizePrefix');
                    return manifest;
                },

                visitSolAmountType({ number }, { self }) {
                    const numberManifest = visit(number, self);

                    const lamportsType = 'LamportsUnsafeBeyond2Pow53Minus1';
                    const lamportsImport = new ImportMap().add(
                        'solanaRpcTypes',
                        'type LamportsUnsafeBeyond2Pow53Minus1',
                    );

                    return {
                        ...numberManifest,
                        decoder: numberManifest.decoder
                            .mapRender(r => `getLamportsDecoder(${r})`)
                            .addImports('solanaRpcTypes', 'getLamportsDecoder'),
                        encoder: numberManifest.encoder
                            .mapRender(r => `getLamportsEncoder(${r})`)
                            .addImports('solanaRpcTypes', 'getLamportsEncoder'),
                        looseType: fragment(lamportsType, lamportsImport),
                        strictType: fragment(lamportsType, lamportsImport),
                    };
                },

                visitSomeValue(node, { self }) {
                    const manifest = typeManifest();
                    manifest.value = visit(node.value, self)
                        .value.mapRender(r => `some(${r})`)
                        .addImports('solanaOptions', 'some');
                    return manifest;
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
                                throw new Error(`Unsupported string encoding: ${stringType.encoding}`);
                        }
                    })();
                    return {
                        defaultValues: fragment(''),
                        decoder: fragment(`${decoder}()`).addImports('solanaCodecsStrings', decoder),
                        encoder: fragment(`${encoder}()`).addImports('solanaCodecsStrings', encoder),
                        isEnum: false,
                        looseType: fragment('string'),
                        strictType: fragment('string'),
                        value: fragment(''),
                    };
                },

                visitStringValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(JSON.stringify(node.string));
                    return manifest;
                },

                visitStructFieldType(structFieldType, { self }) {
                    const name = camelCase(structFieldType.name);
                    const childManifest = visit(structFieldType.type, self);
                    const docblock = structFieldType.docs.length > 0 ? `\n${jsDocblock(structFieldType.docs)}` : '';
                    const originalLooseType = childManifest.looseType.render;
                    childManifest.strictType.mapRender(r => `${docblock}${name}: ${r}; `);
                    childManifest.looseType.mapRender(r => `${docblock}${name}: ${r}; `);
                    childManifest.encoder.mapRender(r => `['${name}', ${r}]`);
                    childManifest.decoder.mapRender(r => `['${name}', ${r}]`);

                    // No default value.
                    if (!structFieldType.defaultValue) {
                        return childManifest;
                    }

                    // Optional default value.
                    if (structFieldType.defaultValueStrategy !== 'omitted') {
                        childManifest.looseType.setRender(`${docblock}${name}?: ${originalLooseType}; `);
                        return childManifest;
                    }

                    // Omitted default value.
                    childManifest.looseType = fragment('');
                    return childManifest;
                },

                visitStructFieldValue(node, { self }) {
                    const manifest = typeManifest();
                    manifest.value = visit(node.value, self).value.mapRender(r => `${node.name}: ${r}`);
                    return manifest;
                },

                visitStructType(structType, { self }) {
                    const optionalFields = structType.fields.filter(f => !!f.defaultValue);

                    const mergedManifest = mergeManifests(
                        structType.fields.map(field => visit(field, self)),
                        {
                            mergeCodecs: renders => `([${renders.join(', ')}])`,
                            mergeTypes: renders => `{ ${renders.join('')} }`,
                        },
                    );

                    mergedManifest.encoder
                        .mapRender(r => `getStructEncoder${r}`)
                        .addImports('solanaCodecsDataStructures', 'getStructEncoder');
                    mergedManifest.decoder
                        .mapRender(r => `getStructDecoder${r}`)
                        .addImports('solanaCodecsDataStructures', 'getStructDecoder');

                    if (optionalFields.length === 0) {
                        return mergedManifest;
                    }

                    const getConstantKey = (name: string) => {
                        const structName = parentName?.strict ?? '';
                        return nameApi.typeConstant(`${structName}_${name}`);
                    }

                    const defaultValues = optionalFields
                        .map(f => {
                            const constantKey = getConstantKey(f.name);
                            const defaultValue = f.defaultValue as NonNullable<typeof f.defaultValue>;
                            const { render: renderedValue, imports } = visit(defaultValue, self).value;
                            mergedManifest.defaultValues.mergeImportsWith(imports);
                            return `export const ${constantKey} = ${renderedValue}`;
                        })
                        .join('\n');

                    mergedManifest.defaultValues
                        .mapRender(r => `${r}\n${defaultValues}`);

                    const presetValues = optionalFields
                        .map(f => {
                            const key = camelCase(f.name);
                            const constantKey = getConstantKey(f.name);
                            return f.defaultValueStrategy === 'omitted'
                                ? `${key}: ${constantKey}`
                                : `${key}: value.${key} ?? ${constantKey}`;
                        })
                        .join(', ');

                    mergedManifest.encoder
                        .mapRender(r => `transformEncoder(${r}, (value) => ({ ...value, ${presetValues} }))`)
                        .addImports('solanaCodecsCore', 'transformEncoder');
                    return mergedManifest;
                },

                visitStructValue(node, { self }) {
                    return mergeManifests(
                        node.fields.map(field => visit(field, self)),
                        { mergeValues: renders => `{ ${renders.join(', ')} }` },
                    );
                },

                visitTupleType(tupleType, { self }) {
                    const items = tupleType.items.map(item => visit(item, self));
                    const mergedManifest = mergeManifests(items, {
                        mergeCodecs: codecs => `[${codecs.join(', ')}]`,
                        mergeTypes: types => `readonly [${types.join(', ')}]`,
                    });
                    mergedManifest.encoder
                        .mapRender(render => `getTupleEncoder(${render})`)
                        .addImports('solanaCodecsDataStructures', 'getTupleEncoder');
                    mergedManifest.decoder
                        .mapRender(render => `getTupleDecoder(${render})`)
                        .addImports('solanaCodecsDataStructures', 'getTupleDecoder');
                    return mergedManifest;
                },

                visitTupleValue(node, { self }) {
                    return mergeManifests(
                        node.items.map(v => visit(v, self)),
                        { mergeValues: renders => `[${renders.join(', ')}]` },
                    );
                },

                visitZeroableOptionType(node, { self }) {
                    const childManifest = visit(node.item, self);
                    childManifest.strictType.mapRender(r => `Option<${r}>`).addImports('solanaOptions', 'type Option');
                    childManifest.looseType
                        .mapRender(r => `OptionOrNullable<${r}>`)
                        .addImports('solanaOptions', 'type OptionOrNullable');
                    const encoderOptions: string[] = ['prefix: null'];
                    const decoderOptions: string[] = ['prefix: null'];

                    // Zero-value option.
                    if (node.zeroValue) {
                        const zeroValueManifest = visit(node.zeroValue, self);
                        childManifest.encoder.mergeImportsWith(zeroValueManifest.value);
                        childManifest.decoder.mergeImportsWith(zeroValueManifest.value);
                        encoderOptions.push(`noneValue: ${zeroValueManifest.value.render}`);
                        decoderOptions.push(`noneValue: ${zeroValueManifest.value.render}`);
                    } else {
                        encoderOptions.push(`noneValue: "zeroes"`);
                        decoderOptions.push(`noneValue: "zeroes"`);
                    }

                    const encoderOptionsAsString =
                        encoderOptions.length > 0 ? `, { ${encoderOptions.join(', ')} }` : '';
                    const decoderOptionsAsString =
                        decoderOptions.length > 0 ? `, { ${decoderOptions.join(', ')} }` : '';
                    childManifest.encoder
                        .mapRender(r => `getOptionEncoder(${r + encoderOptionsAsString})`)
                        .addImports('solanaOptions', 'getOptionEncoder');
                    childManifest.decoder
                        .mapRender(r => `getOptionDecoder(${r + decoderOptionsAsString})`)
                        .addImports('solanaOptions', 'getOptionDecoder');
                    return childManifest;
                },
            }),
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
    prefixManifest.encoder.mapRender(r => `size: ${r}`);
    prefixManifest.decoder.mapRender(r => `size: ${r}`);
    return prefixManifest;
}
