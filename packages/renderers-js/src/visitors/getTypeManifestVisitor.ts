import {
    camelCase,
    CamelCaseString,
    CountNode,
    isNode,
    isNodeFilter,
    isScalarEnum,
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

import {
    addFragmentImports,
    Fragment,
    fragment,
    getBytesFromBytesValueNode,
    getDocblockFragment,
    GetImportFromFunction,
    mergeFragments,
    mergeTypeManifests,
    NameApi,
    ParsedCustomDataOptions,
    TypeManifest,
    typeManifest,
    use,
} from '../utils';

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
                    const encoderOptions = sizeManifest.encoder ? fragment`, { ${sizeManifest.encoder} }` : '';
                    const decoderOptions = sizeManifest.decoder ? fragment`, { ${sizeManifest.decoder} }` : '';

                    return typeManifest({
                        ...childManifest,
                        decoder: fragment`${use('getArrayDecoder', 'solanaCodecsDataStructures')}(${childManifest.decoder}${decoderOptions})`,
                        encoder: fragment`${use('getArrayEncoder', 'solanaCodecsDataStructures')}(${childManifest.encoder}${encoderOptions})`,
                        looseType: fragment`Array<${childManifest.looseType}>`,
                        strictType: fragment`Array<${childManifest.strictType}>`,
                    });
                },

                visitArrayValue(node, { self }) {
                    return mergeTypeManifests(
                        node.items.map(v => visit(v, self)),
                        { mergeValues: renders => `[${renders.join(', ')}]` },
                    );
                },

                visitBooleanType(booleanType, { self }) {
                    let sizeEncoder = fragment``;
                    let sizeDecoder = fragment``;
                    const resolvedSize = resolveNestedTypeNode(booleanType.size);
                    if (resolvedSize.format !== 'u8' || resolvedSize.endian !== 'le') {
                        const size = visit(booleanType.size, self);
                        sizeEncoder = fragment`{ size: ${size.encoder} }`;
                        sizeDecoder = fragment`{ size: ${size.decoder} }`;
                    }

                    return typeManifest({
                        decoder: fragment`${use('getBooleanDecoder', 'solanaCodecsDataStructures')}(${sizeDecoder})`,
                        encoder: fragment`${use('getBooleanEncoder', 'solanaCodecsDataStructures')}(${sizeEncoder})`,
                        looseType: fragment`boolean`,
                        strictType: fragment`boolean`,
                    });
                },

                visitBooleanValue(node) {
                    return typeManifest({ value: fragment`${JSON.stringify(node.boolean)}` });
                },

                visitBytesType() {
                    const readonlyUint8Array = use('type ReadonlyUint8Array', 'solanaCodecsCore');
                    return typeManifest({
                        decoder: fragment`${use('getBytesDecoder', 'solanaCodecsDataStructures')}()`,
                        encoder: fragment`${use('getBytesEncoder', 'solanaCodecsDataStructures')}()`,
                        looseType: readonlyUint8Array,
                        strictType: readonlyUint8Array,
                    });
                },

                visitBytesValue(node) {
                    const bytes = getBytesFromBytesValueNode(node);
                    return typeManifest({ value: fragment`new Uint8Array([${Array.from(bytes).join(', ')}])` });
                },

                visitConstantValue(node, { self }) {
                    if (isNode(node.type, 'bytesTypeNode') && isNode(node.value, 'bytesValueNode')) {
                        return visit(node.value, self);
                    }
                    return typeManifest({
                        value: fragment`${visit(node.type, self).encoder}.encode(${visit(node.value, self).value})`,
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
                        decoder: fragment`${use(decoderFunction, importFrom)}()`,
                        encoder: fragment`${use(encoderFunction, importFrom)}()`,
                        looseType: use(`type ${looseName}`, importFrom),
                        strictType: use(`type ${strictName}`, importFrom),
                    });
                },

                visitEnumEmptyVariantType(enumEmptyVariantType) {
                    const discriminator = nameApi.discriminatedUnionDiscriminator(camelCase(parentName?.strict ?? ''));
                    const name = nameApi.discriminatedUnionVariant(enumEmptyVariantType.name);
                    const kindAttribute = `${discriminator}: "${name}"`;
                    return typeManifest({
                        decoder: fragment`['${name}', ${use('getUnitDecoder', 'solanaCodecsDataStructures')}()]`,
                        encoder: fragment`['${name}', ${use('getUnitEncoder', 'solanaCodecsDataStructures')}()]`,
                        looseType: fragment`{ ${kindAttribute} }`,
                        strictType: fragment`{ ${kindAttribute} }`,
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
                        decoder: fragment`['${name}', ${structManifest.decoder}]`,
                        encoder: fragment`['${name}', ${structManifest.encoder}]`,
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
                        decoder: fragment`['${name}', ${structManifest.decoder}]`,
                        encoder: fragment`['${name}', ${structManifest.encoder}]`,
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
                    const encoderOptions: Fragment[] = [];
                    const decoderOptions: Fragment[] = [];

                    const enumSize = resolveNestedTypeNode(enumType.size);
                    if (enumSize.format !== 'u8' || enumSize.endian !== 'le') {
                        const sizeManifest = visit(enumType.size, self);
                        encoderOptions.push(fragment`size: ${sizeManifest.encoder}`);
                        decoderOptions.push(fragment`size: ${sizeManifest.decoder}`);
                    }

                    const discriminator = nameApi.discriminatedUnionDiscriminator(
                        camelCase(currentParentName?.strict ?? ''),
                    );
                    if (!isScalarEnum(enumType) && discriminator !== '__kind') {
                        encoderOptions.push(fragment`discriminator: '${discriminator}'`);
                        decoderOptions.push(fragment`discriminator: '${discriminator}'`);
                    }

                    const encoderOptionsFragment = mergeFragments(encoderOptions, cs =>
                        cs.length > 0 ? `, { ${cs.join(', ')} }` : '',
                    );
                    const decoderOptionsFragment = mergeFragments(decoderOptions, cs =>
                        cs.length > 0 ? `, { ${cs.join(', ')} }` : '',
                    );

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
                            decoder: fragment`${use('getEnumDecoder', 'solanaCodecsDataStructures')}(${currentParentName.strict}${decoderOptionsFragment})`,
                            encoder: fragment`${use('getEnumEncoder', 'solanaCodecsDataStructures')}(${currentParentName.strict}${encoderOptionsFragment})`,
                            isEnum: true,
                            looseType: fragment`{ ${variantNames.join(', ')} }`,
                            strictType: fragment`{ ${variantNames.join(', ')} }`,
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
                        decoder: fragment`${use('getDiscriminatedUnionDecoder', 'solanaCodecsDataStructures')}([${mergedManifest.decoder}]${decoderOptionsFragment})`,
                        encoder: fragment`${use('getDiscriminatedUnionEncoder', 'solanaCodecsDataStructures')}([${mergedManifest.encoder}]${encoderOptionsFragment})`,
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
                        decoder: fragment`${use('fixDecoderSize', 'solanaCodecsCore')}(${manifest.decoder}, ${node.size})`,
                        encoder: fragment`${use('fixEncoderSize', 'solanaCodecsCore')}(${manifest.encoder}, ${node.size})`,
                    });
                },

                visitHiddenPrefixType(node, { self }) {
                    const manifest = visit(node.type, self);
                    const prefixes = node.prefix.map(c => visit(c, self).value);
                    const prefixEncoders = pipe(
                        mergeFragments(prefixes, cs => cs.map(c => `getConstantEncoder(${c})`).join(', ')),
                        f => addFragmentImports(f, 'solanaCodecsCore', ['getConstantEncoder']),
                    );
                    const prefixDecoders = pipe(
                        mergeFragments(prefixes, cs => cs.map(c => `getConstantDecoder(${c})`).join(', ')),
                        f => addFragmentImports(f, 'solanaCodecsCore', ['getConstantDecoder']),
                    );

                    return typeManifest({
                        ...manifest,
                        decoder: fragment`${use('getHiddenPrefixDecoder', 'solanaCodecsDataStructures')}(${manifest.decoder}, [${prefixDecoders}])`,
                        encoder: fragment`${use('getHiddenPrefixEncoder', 'solanaCodecsDataStructures')}(${manifest.encoder}, [${prefixEncoders}])`,
                    });
                },

                visitHiddenSuffixType(node, { self }) {
                    const manifest = visit(node.type, self);
                    const suffixes = node.suffix.map(c => visit(c, self).value);
                    const suffixEncoders = pipe(
                        mergeFragments(suffixes, cs => cs.map(c => `getConstantEncoder(${c})`).join(', ')),
                        f => addFragmentImports(f, 'solanaCodecsCore', ['getConstantEncoder']),
                    );
                    const suffixDecoders = pipe(
                        mergeFragments(suffixes, cs => cs.map(c => `getConstantDecoder(${c})`).join(', ')),
                        f => addFragmentImports(f, 'solanaCodecsCore', ['getConstantDecoder']),
                    );

                    return typeManifest({
                        ...manifest,
                        decoder: fragment`${use('getHiddenSuffixDecoder', 'solanaCodecsDataStructures')}(${manifest.decoder}, [${suffixDecoders}])`,
                        encoder: fragment`${use('getHiddenSuffixEncoder', 'solanaCodecsDataStructures')}(${manifest.encoder}, [${suffixEncoders}])`,
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
                    const encoderOptions = sizeManifest.encoder ? fragment`, { ${sizeManifest.encoder} }` : '';
                    const decoderOptions = sizeManifest.decoder ? fragment`, { ${sizeManifest.decoder} }` : '';

                    return typeManifest({
                        ...mergedManifest,
                        decoder: fragment`${use('getMapDecoder', 'solanaCodecsDataStructures')}(${mergedManifest.decoder}${decoderOptions})`,
                        encoder: fragment`${use('getMapEncoder', 'solanaCodecsDataStructures')}(${mergedManifest.encoder}${encoderOptions})`,
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
                        value: fragment`${use('none', 'solanaOptions')}()`,
                    });
                },

                visitNumberType(numberType) {
                    const encoderFunction = use(nameApi.encoderFunction(numberType.format), 'solanaCodecsNumbers');
                    const decoderFunction = use(nameApi.decoderFunction(numberType.format), 'solanaCodecsNumbers');
                    const isBigNumber = ['u64', 'u128', 'i64', 'i128'].includes(numberType.format);
                    const endianness =
                        numberType.endian === 'be'
                            ? fragment`{ endian: ${use('Endian', 'solanaCodecsNumbers')}.Big }`
                            : '';
                    return typeManifest({
                        decoder: fragment`${decoderFunction}(${endianness})`,
                        encoder: fragment`${encoderFunction}(${endianness})`,
                        looseType: fragment`${isBigNumber ? 'number | bigint' : 'number'}`,
                        strictType: fragment`${isBigNumber ? 'bigint' : 'number'}`,
                    });
                },

                visitNumberValue(node) {
                    return typeManifest({ value: fragment`${JSON.stringify(node.number)}` });
                },

                visitOptionType(optionType, { self }) {
                    const childManifest = visit(optionType.item, self);
                    const encoderOptions: Fragment[] = [];
                    const decoderOptions: Fragment[] = [];

                    // Prefix option.
                    const optionPrefix = resolveNestedTypeNode(optionType.prefix);
                    if (optionPrefix.format !== 'u8' || optionPrefix.endian !== 'le') {
                        const prefixManifest = visit(optionType.prefix, self);
                        encoderOptions.push(fragment`prefix: ${prefixManifest.encoder}`);
                        decoderOptions.push(fragment`prefix: ${prefixManifest.decoder}`);
                    }

                    // Fixed option.
                    if (optionType.fixed) {
                        encoderOptions.push(fragment`noneValue: "zeroes"`);
                        decoderOptions.push(fragment`noneValue: "zeroes"`);
                    }

                    const encoderOptionsFragment = mergeFragments(encoderOptions, cs =>
                        cs.length > 0 ? `, { ${cs.join(', ')} }` : '',
                    );
                    const decoderOptionsFragment = mergeFragments(decoderOptions, cs =>
                        cs.length > 0 ? `, { ${cs.join(', ')} }` : '',
                    );

                    return typeManifest({
                        ...childManifest,
                        decoder: fragment`${use('getOptionDecoder', 'solanaOptions')}(${childManifest.decoder}${decoderOptionsFragment})`,
                        encoder: fragment`${use('getOptionEncoder', 'solanaOptions')}(${childManifest.encoder}${encoderOptionsFragment})`,
                        looseType: fragment`${use('type OptionOrNullable', 'solanaOptions')}<${childManifest.looseType}>`,
                        strictType: fragment`${use('type Option', 'solanaOptions')}<${childManifest.strictType}>`,
                    });
                },

                visitPostOffsetType(node, { self }) {
                    const manifest = visit(node.type, self);
                    if (node.strategy === 'padded') {
                        return typeManifest({
                            ...manifest,
                            decoder: fragment`${use('padRightDecoder', 'solanaCodecsCore')}(${manifest.decoder}, ${node.offset})`,
                            encoder: fragment`${use('padRightEncoder', 'solanaCodecsCore')}(${manifest.encoder}, ${node.offset})`,
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
                        decoder: fragment`${use('offsetDecoder', 'solanaCodecsCore')}(${manifest.decoder}, { postOffset: ${fn} })`,
                        encoder: fragment`${use('offsetEncoder', 'solanaCodecsCore')}(${manifest.encoder}, { postOffset: ${fn} })`,
                    });
                },

                visitPreOffsetType(node, { self }) {
                    const manifest = visit(node.type, self);
                    if (node.strategy === 'padded') {
                        return typeManifest({
                            ...manifest,
                            decoder: fragment`${use('padLeftDecoder', 'solanaCodecsCore')}(${manifest.decoder}, ${node.offset})`,
                            encoder: fragment`${use('padLeftEncoder', 'solanaCodecsCore')}(${manifest.encoder}, ${node.offset})`,
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
                        decoder: fragment`${use('offsetDecoder', 'solanaCodecsCore')}(${manifest.decoder}, { preOffset: ${fn} })`,
                        encoder: fragment`${use('offsetEncoder', 'solanaCodecsCore')}(${manifest.encoder}, { preOffset: ${fn} })`,
                    });
                },

                visitPublicKeyType() {
                    return typeManifest({
                        decoder: fragment`${use('getAddressDecoder', 'solanaAddresses')}()`,
                        encoder: fragment`${use('getAddressEncoder', 'solanaAddresses')}()`,
                        looseType: use('type Address', 'solanaAddresses'),
                        strictType: use('type Address', 'solanaAddresses'),
                    });
                },

                visitPublicKeyValue(node) {
                    return typeManifest({
                        value: fragment`${use('address', 'solanaAddresses')}("${node.publicKey}")`,
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
                        decoder: fragment`${use('getOptionDecoder', 'solanaOptions')}(${childManifest.decoder}${decoderOptionsAsString})`,
                        encoder: fragment`${use('getOptionEncoder', 'solanaOptions')}(${childManifest.encoder}${encoderOptionsAsString})`,
                        looseType: fragment`${use('type OptionOrNullable', 'solanaOptions')}<${childManifest.looseType}>`,
                        strictType: fragment`${use('type Option', 'solanaOptions')}<${childManifest.strictType}>`,
                    });
                },

                visitSentinelType(node, { self }) {
                    const manifest = visit(node.type, self);
                    const sentinel = visit(node.sentinel, self).value;
                    return typeManifest({
                        ...manifest,
                        decoder: fragment`${use('addDecoderSentinel', 'solanaCodecsCore')}(${manifest.decoder}, ${sentinel})`,
                        encoder: fragment`${use('addEncoderSentinel', 'solanaCodecsCore')}(${manifest.encoder}, ${sentinel})`,
                    });
                },

                visitSetType(setType, { self }) {
                    const childManifest = visit(setType.item, self);
                    const sizeManifest = getArrayLikeSizeOption(setType.count, self);
                    const encoderOptions = sizeManifest.encoder ? fragment`, { ${sizeManifest.encoder} }` : '';
                    const decoderOptions = sizeManifest.decoder ? fragment`, { ${sizeManifest.decoder} }` : '';

                    return typeManifest({
                        ...childManifest,
                        decoder: fragment`${use('getSetDecoder', 'solanaCodecsDataStructures')}(${childManifest.decoder}${decoderOptions})`,
                        encoder: fragment`${use('getSetEncoder', 'solanaCodecsDataStructures')}(${childManifest.encoder}${encoderOptions})`,
                        looseType: fragment`Set<${childManifest.looseType}>`,
                        strictType: fragment`Set<${childManifest.strictType}>`,
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
                        decoder: fragment`${use('addDecoderSizePrefix', 'solanaCodecsCore')}(${manifest.decoder}, ${prefix.decoder})`,
                        encoder: fragment`${use('addEncoderSizePrefix', 'solanaCodecsCore')}(${manifest.encoder}, ${prefix.encoder})`,
                    });
                },

                visitSolAmountType({ number }, { self }) {
                    const numberManifest = visit(number, self);

                    return typeManifest({
                        ...numberManifest,
                        decoder: fragment`${use('getLamportsDecoder', 'solanaRpcTypes')}(${numberManifest.decoder})`,
                        encoder: fragment`${use('getLamportsEncoder', 'solanaRpcTypes')}(${numberManifest.encoder})`,
                        looseType: use('type Lamports', 'solanaRpcTypes'),
                        strictType: use('type Lamports', 'solanaRpcTypes'),
                    });
                },

                visitSomeValue(node, { self }) {
                    const innerValue = visit(node.value, self).value;
                    return typeManifest({
                        value: fragment`${use('some', 'solanaOptions')}(${innerValue})`,
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
                        decoder: fragment`${use(decoder, 'solanaCodecsStrings')}()`,
                        encoder: fragment`${use(encoder, 'solanaCodecsStrings')}()`,
                        looseType: fragment`string`,
                        strictType: fragment`string`,
                    });
                },

                visitStringValue(node) {
                    return typeManifest({
                        value: fragment`${JSON.stringify(node.string)}`,
                    });
                },

                visitStructFieldType(structFieldType, { self }) {
                    const name = camelCase(structFieldType.name);
                    const originalChildManifest = visit(structFieldType.type, self);
                    let docs = getDocblockFragment(structFieldType.docs ?? [], true);
                    docs = docs ? fragment`\n${docs}` : docs;
                    const childManifest = typeManifest({
                        ...originalChildManifest,
                        decoder: fragment`['${name}', ${originalChildManifest.decoder}]`,
                        encoder: fragment`['${name}', ${originalChildManifest.encoder}]`,
                        looseType: fragment`${docs}${name}: ${originalChildManifest.looseType}; `,
                        strictType: fragment`${docs}${name}: ${originalChildManifest.strictType}; `,
                    });

                    // No default value.
                    if (!structFieldType.defaultValue) {
                        return childManifest;
                    }

                    // Optional default value.
                    if (structFieldType.defaultValueStrategy !== 'omitted') {
                        return typeManifest({
                            ...childManifest,
                            looseType: fragment`${docs}${name}?: ${originalChildManifest.looseType}; `,
                        });
                    }

                    // Omitted default value.
                    return typeManifest({ ...childManifest, looseType: fragment`` });
                },

                visitStructFieldValue(node, { self }) {
                    const innerValue = visit(node.value, self).value;
                    return typeManifest({
                        value: fragment`${node.name}: ${innerValue}`,
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
                                decoder: fragment`${use('getStructDecoder', 'solanaCodecsDataStructures')}${manifest.decoder}`,
                                encoder: fragment`${use('getStructEncoder', 'solanaCodecsDataStructures')}${manifest.encoder}`,
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

                    const defaultValues = mergeFragments(
                        optionalFields.map((f): Fragment => {
                            const key = camelCase(f.name);

                            // If the field has an associated discriminator node, use the constant value instead.
                            if (fieldDiscriminators.some(d => d.name === f.name)) {
                                const constantName = nameApi.constant(camelCase(`${discriminatorPrefix}_${f.name}`));
                                return f.defaultValueStrategy === 'omitted'
                                    ? fragment`${key}: ${constantName}`
                                    : fragment`${key}: value.${key} ?? ${constantName}`;
                            }

                            const defaultValue = f.defaultValue as NonNullable<typeof f.defaultValue>;
                            const value = visit(defaultValue, self).value;
                            return f.defaultValueStrategy === 'omitted'
                                ? fragment`${key}: ${value}`
                                : fragment`${key}: value.${key} ?? ${value}`;
                        }),
                        cs => cs.join(', '),
                    );

                    return typeManifest({
                        ...mergedManifest,
                        encoder: fragment`${use('transformEncoder', 'solanaCodecsCore')}(${mergedManifest.encoder}, (value) => ({ ...value, ${defaultValues} }))`,
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
                        decoder: fragment`${use('getTupleDecoder', 'solanaCodecsDataStructures')}(${mergedManifest.decoder})`,
                        encoder: fragment`${use('getTupleEncoder', 'solanaCodecsDataStructures')}(${mergedManifest.encoder})`,
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
                    const encoderOptions: Fragment[] = [fragment`prefix: null`];
                    const decoderOptions: Fragment[] = [fragment`prefix: null`];

                    // Zero-value option.
                    if (node.zeroValue) {
                        const zeroValueManifest = visit(node.zeroValue, self);
                        encoderOptions.push(fragment`noneValue: ${zeroValueManifest.value}`);
                        decoderOptions.push(fragment`noneValue: ${zeroValueManifest.value}`);
                    } else {
                        encoderOptions.push(fragment`noneValue: "zeroes"`);
                        decoderOptions.push(fragment`noneValue: "zeroes"`);
                    }

                    const encoderOptionsFragment = mergeFragments(encoderOptions, cs =>
                        cs.length > 0 ? `, { ${cs.join(', ')} }` : '',
                    );
                    const decoderOptionsFragment = mergeFragments(decoderOptions, cs =>
                        cs.length > 0 ? `, { ${cs.join(', ')} }` : '',
                    );

                    return typeManifest({
                        ...childManifest,
                        decoder: fragment`${use('getOptionDecoder', 'solanaOptions')}(${childManifest.decoder}${decoderOptionsFragment})`,
                        encoder: fragment`${use('getOptionEncoder', 'solanaOptions')}(${childManifest.encoder}${encoderOptionsFragment})`,
                        looseType: fragment`${use('type OptionOrNullable', 'solanaOptions')}<${childManifest.looseType}>`,
                        strictType: fragment`${use('type Option', 'solanaOptions')}<${childManifest.strictType}>`,
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
    decoder: Fragment | undefined;
    encoder: Fragment | undefined;
} {
    if (isNode(count, 'fixedCountNode')) {
        return {
            decoder: fragment`size: ${count.value}`,
            encoder: fragment`size: ${count.value}`,
        };
    }
    if (isNode(count, 'remainderCountNode')) {
        return {
            decoder: fragment`size: 'remainder'`,
            encoder: fragment`size: 'remainder'`,
        };
    }
    const prefix = resolveNestedTypeNode(count.prefix);
    if (prefix.format === 'u32' && prefix.endian === 'le') {
        return { decoder: undefined, encoder: undefined };
    }
    const prefixManifest = visit(count.prefix, visitor);
    return {
        decoder: pipe(prefixManifest.decoder, f => mapFragmentContent(f, c => `size: ${c}`)),
        encoder: pipe(prefixManifest.encoder, f => mapFragmentContent(f, c => `size: ${c}`)),
    };
}
