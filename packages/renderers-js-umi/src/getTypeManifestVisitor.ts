import { KINOBI_ERROR__RENDERERS__UNSUPPORTED_NODE, KinobiError } from '@kinobi-so/errors';
import {
    ArrayTypeNode,
    camelCase,
    CamelCaseString,
    isInteger,
    isNode,
    isScalarEnum,
    isUnsignedInteger,
    NumberTypeNode,
    pascalCase,
    REGISTERED_TYPE_NODE_KINDS,
    REGISTERED_VALUE_NODE_KINDS,
    resolveNestedTypeNode,
    structFieldTypeNode,
    structTypeNode,
    structTypeNodeFromInstructionArgumentNodes,
    TypeNode,
} from '@kinobi-so/nodes';
import { extendVisitor, LinkableDictionary, pipe, staticVisitor, visit, Visitor } from '@kinobi-so/visitors-core';

import { ImportMap } from './ImportMap';
import { getBytesFromBytesValueNode, GetImportFromFunction, jsDocblock, ParsedCustomDataOptions } from './utils';

export type TypeManifest = {
    isEnum: boolean;
    looseImports: ImportMap;
    looseType: string;
    serializer: string;
    serializerImports: ImportMap;
    strictImports: ImportMap;
    strictType: string;
    value: string;
    valueImports: ImportMap;
};

function typeManifest(): TypeManifest {
    return {
        isEnum: false,
        looseImports: new ImportMap(),
        looseType: '',
        serializer: '',
        serializerImports: new ImportMap(),
        strictImports: new ImportMap(),
        strictType: '',
        value: '',
        valueImports: new ImportMap(),
    };
}

export function getTypeManifestVisitor(input: {
    customAccountData: ParsedCustomDataOptions;
    customInstructionData: ParsedCustomDataOptions;
    getImportFrom: GetImportFromFunction;
    linkables: LinkableDictionary;
    nonScalarEnums: CamelCaseString[];
    parentName?: { loose: string; strict: string };
}) {
    const { linkables, nonScalarEnums, customAccountData, customInstructionData, getImportFrom } = input;
    let parentName = input.parentName ?? null;
    let parentSize: NumberTypeNode | number | null = null;

    return pipe(
        staticVisitor(
            () =>
                ({
                    isEnum: false,
                    looseImports: new ImportMap(),
                    looseType: '',
                    serializer: '',
                    serializerImports: new ImportMap(),
                    strictImports: new ImportMap(),
                    strictType: '',
                    value: '',
                    valueImports: new ImportMap(),
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
        v =>
            extendVisitor(v, {
                visitAccount(account, { self }) {
                    parentName = {
                        loose: `${pascalCase(account.name)}AccountDataArgs`,
                        strict: `${pascalCase(account.name)}AccountData`,
                    };
                    const link = customAccountData.get(account.name)?.linkNode;
                    const manifest = link ? visit(link, self) : visit(account.data, self);
                    parentName = null;
                    return manifest;
                },

                visitAmountType(amountType, { self }) {
                    const numberManifest = visit(amountType.number, self);
                    const resolvedNode = resolveNestedTypeNode(amountType.number);
                    if (!isUnsignedInteger(resolvedNode)) {
                        throw new Error(
                            `Amount wrappers can only be applied to unsigned ` +
                                `integer types. Got type [${amountType.number.toString()}].`,
                        );
                    }
                    const { unit, decimals } = amountType;
                    const idAndDecimals = `'${unit ?? 'Unknown'}', ${decimals}`;
                    const isSolAmount = unit === 'SOL' && decimals === 9;
                    const amountTypeString = isSolAmount ? 'SolAmount' : `Amount<${idAndDecimals}>`;
                    const amountImport = isSolAmount ? 'SolAmount' : 'Amount';
                    numberManifest.strictImports.add('umi', amountImport);
                    numberManifest.looseImports.add('umi', amountImport);
                    numberManifest.serializerImports.add('umi', 'mapAmountSerializer');
                    return {
                        ...numberManifest,
                        looseType: amountTypeString,
                        serializer: `mapAmountSerializer(${numberManifest.serializer}, ${idAndDecimals})`,
                        strictType: amountTypeString,
                    };
                },

                visitArrayType(arrayType, { self }) {
                    const childManifest = visit(arrayType.item, self);
                    childManifest.serializerImports.add('umiSerializers', 'array');
                    const sizeOption = getArrayLikeSizeOption(arrayType.count, childManifest, self);
                    const options = sizeOption ? `, { ${sizeOption} }` : '';
                    return {
                        ...childManifest,
                        looseType: `Array<${childManifest.looseType}>`,
                        serializer: `array(${childManifest.serializer + options})`,
                        strictType: `Array<${childManifest.strictType}>`,
                    };
                },

                visitArrayValue(node, { self }) {
                    const list = node.items.map(value => visit(value, self));
                    return {
                        ...typeManifest(),
                        value: `[${list.map(c => c.value).join(', ')}]`,
                        valueImports: new ImportMap().mergeWith(...list.map(c => c.valueImports)),
                    };
                },

                visitBooleanType(booleanType, { self }) {
                    const looseImports = new ImportMap();
                    const strictImports = new ImportMap();
                    const serializerImports = new ImportMap().add('umiSerializers', 'bool');
                    let sizeSerializer = '';
                    const resolvedSize = resolveNestedTypeNode(booleanType.size);
                    if (resolvedSize.format !== 'u8' || resolvedSize.endian !== 'le') {
                        const size = visit(booleanType.size, self);
                        looseImports.mergeWith(size.looseImports);
                        strictImports.mergeWith(size.strictImports);
                        serializerImports.mergeWith(size.serializerImports);
                        sizeSerializer = `{ size: ${size.serializer} }`;
                    }

                    return {
                        isEnum: false,
                        looseImports,
                        looseType: 'boolean',
                        serializer: `bool(${sizeSerializer})`,
                        serializerImports,
                        strictImports,
                        strictType: 'boolean',
                        value: '',
                        valueImports: new ImportMap(),
                    };
                },

                visitBooleanValue(node) {
                    return {
                        ...typeManifest(),
                        value: JSON.stringify(node.boolean),
                    };
                },

                visitBytesType(_bytesType, { self }) {
                    const strictImports = new ImportMap();
                    const looseImports = new ImportMap();
                    const serializerImports = new ImportMap().add('umiSerializers', 'bytes');
                    const options: string[] = [];

                    // Size option.
                    if (typeof parentSize === 'number') {
                        options.push(`size: ${parentSize}`);
                    } else if (parentSize) {
                        const prefix = visit(parentSize, self);
                        strictImports.mergeWith(prefix.strictImports);
                        looseImports.mergeWith(prefix.looseImports);
                        serializerImports.mergeWith(prefix.serializerImports);
                        options.push(`size: ${prefix.serializer}`);
                    }

                    const optionsAsString = options.length > 0 ? `{ ${options.join(', ')} }` : '';

                    return {
                        isEnum: false,
                        looseImports,
                        looseType: 'Uint8Array',
                        serializer: `bytes(${optionsAsString})`,
                        serializerImports,
                        strictImports,
                        strictType: 'Uint8Array',
                        value: '',
                        valueImports: new ImportMap(),
                    };
                },

                visitBytesValue(node) {
                    const bytes = getBytesFromBytesValueNode(node);
                    return {
                        ...typeManifest(),
                        value: `new Uint8Array([${Array.from(bytes).join(', ')}])`,
                    };
                },

                visitConstantValue(node, { self }) {
                    if (isNode(node.type, 'bytesTypeNode') && isNode(node.value, 'bytesValueNode')) {
                        return visit(node.value, self);
                    }
                    const imports = new ImportMap();
                    const value = visit(node.value, self);
                    imports.mergeWith(value.valueImports);
                    const type = visit(node.type, self);
                    imports.mergeWith(type.serializerImports);
                    return {
                        ...typeManifest(),
                        value: `${type.serializer}.serialize(${value.value})`,
                        valueImports: imports,
                    };
                },

                visitDateTimeType(dateTimeType, { self }) {
                    const numberManifest = visit(dateTimeType.number, self);
                    const dateTimeNumber = resolveNestedTypeNode(dateTimeType.number);
                    if (!isInteger(dateTimeNumber)) {
                        throw new Error(
                            `DateTime wrappers can only be applied to integer ` +
                                `types. Got type [${dateTimeNumber.toString()}].`,
                        );
                    }
                    numberManifest.strictImports.add('umi', 'DateTime');
                    numberManifest.looseImports.add('umi', 'DateTimeInput');
                    numberManifest.serializerImports.add('umi', 'mapDateTimeSerializer');
                    return {
                        ...numberManifest,
                        looseType: `DateTimeInput`,
                        serializer: `mapDateTimeSerializer(${numberManifest.serializer})`,
                        strictType: `DateTime`,
                    };
                },

                visitDefinedType(definedType, { self }) {
                    parentName = {
                        loose: `${pascalCase(definedType.name)}Args`,
                        strict: pascalCase(definedType.name),
                    };
                    const manifest = visit(definedType.type, self);
                    parentName = null;
                    return manifest;
                },

                visitDefinedTypeLink(node) {
                    const pascalCaseDefinedType = pascalCase(node.name);
                    const serializerName = `get${pascalCaseDefinedType}Serializer`;
                    const importFrom = getImportFrom(node);

                    return {
                        isEnum: false,
                        looseImports: new ImportMap().add(importFrom, `${pascalCaseDefinedType}Args`),
                        looseType: `${pascalCaseDefinedType}Args`,
                        serializer: `${serializerName}()`,
                        serializerImports: new ImportMap().add(importFrom, serializerName),
                        strictImports: new ImportMap().add(importFrom, pascalCaseDefinedType),
                        strictType: pascalCaseDefinedType,
                        value: '',
                        valueImports: new ImportMap(),
                    };
                },

                visitEnumEmptyVariantType(enumEmptyVariantType) {
                    const name = pascalCase(enumEmptyVariantType.name);
                    const kindAttribute = `__kind: "${name}"`;
                    return {
                        isEnum: false,
                        looseImports: new ImportMap(),
                        looseType: `{ ${kindAttribute} }`,
                        serializer: `['${name}', unit()]`,
                        serializerImports: new ImportMap().add('umiSerializers', 'unit'),
                        strictImports: new ImportMap(),
                        strictType: `{ ${kindAttribute} }`,
                        value: '',
                        valueImports: new ImportMap(),
                    };
                },

                visitEnumStructVariantType(enumStructVariantType, { self }) {
                    const name = pascalCase(enumStructVariantType.name);
                    const kindAttribute = `__kind: "${name}"`;
                    const type = visit(enumStructVariantType.struct, self);
                    return {
                        ...type,
                        looseType: `{ ${kindAttribute},${type.looseType.slice(1, -1)}}`,
                        serializer: `['${name}', ${type.serializer}]`,
                        strictType: `{ ${kindAttribute},${type.strictType.slice(1, -1)}}`,
                    };
                },

                visitEnumTupleVariantType(enumTupleVariantType, { self }) {
                    const name = pascalCase(enumTupleVariantType.name);
                    const kindAttribute = `__kind: "${name}"`;
                    const struct = structTypeNode([
                        structFieldTypeNode({
                            name: 'fields',
                            type: enumTupleVariantType.tuple,
                        }),
                    ]);
                    const type = visit(struct, self);
                    return {
                        ...type,
                        looseType: `{ ${kindAttribute},${type.looseType.slice(1, -1)}}`,
                        serializer: `['${name}', ${type.serializer}]`,
                        strictType: `{ ${kindAttribute},${type.strictType.slice(1, -1)}}`,
                        value: '',
                        valueImports: new ImportMap(),
                    };
                },

                visitEnumType(enumType, { self }) {
                    const strictImports = new ImportMap();
                    const looseImports = new ImportMap();
                    const serializerImports = new ImportMap();

                    const variantNames = enumType.variants.map(variant => pascalCase(variant.name));
                    const currentParentName = { ...parentName };
                    parentName = null;
                    const options: string[] = [];

                    const enumSize = resolveNestedTypeNode(enumType.size);
                    if (enumSize.format !== 'u8' || enumSize.endian !== 'le') {
                        const sizeManifest = visit(enumType.size, self);
                        strictImports.mergeWith(sizeManifest.strictImports);
                        looseImports.mergeWith(sizeManifest.looseImports);
                        serializerImports.mergeWith(sizeManifest.serializerImports);
                        options.push(`size: ${sizeManifest.serializer}`);
                    }

                    if (isScalarEnum(enumType)) {
                        if (currentParentName === null) {
                            throw new Error(
                                'Scalar enums cannot be inlined and must be introduced ' +
                                    'via a defined type. Ensure you are not inlining a ' +
                                    'defined type that is a scalar enum through a visitor.',
                            );
                        }
                        options.push(`description: '${currentParentName.strict}'`);
                        const optionsAsString = options.length > 0 ? `, { ${options.join(', ')} }` : '';
                        return {
                            isEnum: true,
                            looseImports,
                            looseType: `{ ${variantNames.join(', ')} }`,
                            serializer:
                                `scalarEnum<${currentParentName.strict}>` +
                                `(${currentParentName.strict + optionsAsString})`,
                            serializerImports: serializerImports.add('umiSerializers', 'scalarEnum'),
                            strictImports,
                            strictType: `{ ${variantNames.join(', ')} }`,
                            value: '',
                            valueImports: new ImportMap(),
                        };
                    }

                    const variants = enumType.variants.map(variant => {
                        const variantName = pascalCase(variant.name);
                        parentName = currentParentName
                            ? {
                                  loose: `GetDataEnumKindContent<${currentParentName.loose}, '${variantName}'>`,
                                  strict: `GetDataEnumKindContent<${currentParentName.strict}, '${variantName}'>`,
                              }
                            : null;
                        const variantManifest = visit(variant, self);
                        parentName = null;
                        return variantManifest;
                    });

                    const mergedManifest = mergeManifests(variants);
                    mergedManifest.strictImports.mergeWith(strictImports);
                    mergedManifest.looseImports.mergeWith(looseImports);
                    mergedManifest.serializerImports.mergeWith(serializerImports);
                    const variantSerializers = variants.map(variant => variant.serializer).join(', ');
                    const serializerTypeParams = currentParentName ? currentParentName.strict : 'any';
                    if (currentParentName?.strict) {
                        options.push(`description: '${pascalCase(currentParentName.strict)}'`);
                    }
                    const optionsAsString = options.length > 0 ? `, { ${options.join(', ')} }` : '';

                    return {
                        ...mergedManifest,
                        looseType: variants.map(variant => variant.looseType).join(' | '),
                        serializer: `dataEnum<${serializerTypeParams}>` + `([${variantSerializers}]${optionsAsString})`,
                        serializerImports: mergedManifest.serializerImports.add('umiSerializers', [
                            'GetDataEnumKindContent',
                            'GetDataEnumKind',
                            'dataEnum',
                        ]),
                        strictType: variants.map(variant => variant.strictType).join(' | '),
                        value: '',
                        valueImports: new ImportMap(),
                    };
                },

                visitEnumValue(node, { self }) {
                    const imports = new ImportMap();
                    const enumName = pascalCase(node.enum.name);
                    const variantName = pascalCase(node.variant);
                    const importFrom = getImportFrom(node.enum);

                    const enumNode = linkables.get(node.enum)?.type;
                    const isScalar =
                        enumNode && isNode(enumNode, 'enumTypeNode')
                            ? isScalarEnum(enumNode)
                            : !nonScalarEnums.includes(node.enum.name);

                    if (!node.value && isScalar) {
                        return {
                            ...typeManifest(),
                            value: `${enumName}.${variantName}`,
                            valueImports: imports.add(importFrom, enumName),
                        };
                    }

                    const enumFn = camelCase(node.enum.name);
                    imports.add(importFrom, enumFn);

                    if (!node.value) {
                        return {
                            ...typeManifest(),
                            value: `${enumFn}('${variantName}')`,
                            valueImports: imports,
                        };
                    }

                    const enumValue = visit(node.value, self);
                    const fields = enumValue.value;
                    imports.mergeWith(enumValue.valueImports);

                    return {
                        ...typeManifest(),
                        value: `${enumFn}('${variantName}', ${fields})`,
                        valueImports: imports,
                    };
                },

                visitFixedSizeType(fixedSizeType, { self }) {
                    parentSize = fixedSizeType.size;
                    const manifest = visit(fixedSizeType.type, self);
                    parentSize = null;
                    return manifest;
                },

                visitInstruction(instruction, { self }) {
                    parentName = {
                        loose: `${pascalCase(instruction.name)}InstructionDataArgs`,
                        strict: `${pascalCase(instruction.name)}InstructionData`,
                    };
                    const link = customInstructionData.get(instruction.name)?.linkNode;
                    const struct = structTypeNodeFromInstructionArgumentNodes(instruction.arguments);
                    const manifest = link ? visit(link, self) : visit(struct, self);
                    parentName = null;
                    return manifest;
                },

                visitMapEntryValue(node, { self }) {
                    const mapKey = visit(node.key, self);
                    const mapValue = visit(node.value, self);
                    return {
                        ...typeManifest(),
                        imports: mapKey.valueImports.mergeWith(mapValue.valueImports),
                        render: `[${mapKey.value}, ${mapValue.value}]`,
                    };
                },

                visitMapType(mapType, { self }) {
                    const key = visit(mapType.key, self);
                    const value = visit(mapType.value, self);
                    const mergedManifest = mergeManifests([key, value]);
                    mergedManifest.serializerImports.add('umiSerializers', 'map');
                    const sizeOption = getArrayLikeSizeOption(mapType.count, mergedManifest, self);
                    const options = sizeOption ? `, { ${sizeOption} }` : '';
                    return {
                        ...mergedManifest,
                        looseType: `Map<${key.looseType}, ${value.looseType}>`,
                        serializer: `map(${key.serializer}, ${value.serializer}${options})`,
                        strictType: `Map<${key.strictType}, ${value.strictType}>`,
                        value: '',
                        valueImports: new ImportMap(),
                    };
                },

                visitMapValue(node, { self }) {
                    const map = node.entries.map(entry => visit(entry, self));
                    return {
                        ...typeManifest(),
                        value: `new Map([${map.map(c => c.value).join(', ')}])`,
                        valueImports: new ImportMap().mergeWith(...map.map(c => c.valueImports)),
                    };
                },

                visitNoneValue() {
                    return {
                        ...typeManifest(),
                        value: 'none()',
                        valueImports: new ImportMap().add('umi', 'none'),
                    };
                },

                visitNumberType(numberType) {
                    const isBigNumber = ['u64', 'u128', 'i64', 'i128'].includes(numberType.format);
                    const serializerImports = new ImportMap().add('umiSerializers', numberType.format);
                    let endianness = '';
                    if (numberType.endian === 'be') {
                        serializerImports.add('umiSerializers', 'Endian');
                        endianness = '{ endian: Endian.Big }';
                    }
                    return {
                        isEnum: false,
                        looseImports: new ImportMap(),
                        looseType: isBigNumber ? 'number | bigint' : 'number',
                        serializer: `${numberType.format}(${endianness})`,
                        serializerImports,
                        strictImports: new ImportMap(),
                        strictType: isBigNumber ? 'bigint' : 'number',
                        value: '',
                        valueImports: new ImportMap(),
                    };
                },

                visitNumberValue(node) {
                    return {
                        ...typeManifest(),
                        value: JSON.stringify(node.number),
                    };
                },

                visitOptionType(optionType, { self }) {
                    const childManifest = visit(optionType.item, self);
                    childManifest.strictImports.add('umi', 'Option');
                    childManifest.looseImports.add('umi', 'OptionOrNullable');
                    childManifest.serializerImports.add('umiSerializers', 'option');
                    const options: string[] = [];

                    // Prefix option.
                    const optionPrefix = resolveNestedTypeNode(optionType.prefix);
                    if (optionPrefix.format !== 'u8' || optionPrefix.endian !== 'le') {
                        const prefixManifest = visit(optionType.prefix, self);
                        childManifest.strictImports.mergeWith(prefixManifest.strictImports);
                        childManifest.looseImports.mergeWith(prefixManifest.looseImports);
                        childManifest.serializerImports.mergeWith(prefixManifest.serializerImports);
                        options.push(`prefix: ${prefixManifest.serializer}`);
                    }

                    // Fixed option.
                    if (optionType.fixed) {
                        options.push(`fixed: true`);
                    }

                    const optionsAsString = options.length > 0 ? `, { ${options.join(', ')} }` : '';

                    return {
                        ...childManifest,
                        looseType: `OptionOrNullable<${childManifest.looseType}>`,
                        serializer: `option(${childManifest.serializer}${optionsAsString})`,
                        strictType: `Option<${childManifest.strictType}>`,
                    };
                },

                visitPublicKeyType() {
                    const imports = new ImportMap().add('umi', 'PublicKey');
                    return {
                        isEnum: false,
                        looseImports: imports,
                        looseType: 'PublicKey',
                        serializer: `publicKeySerializer()`,
                        serializerImports: new ImportMap()
                            .add('umiSerializers', 'publicKey')
                            .addAlias('umiSerializers', 'publicKey', 'publicKeySerializer'),
                        strictImports: imports,
                        strictType: 'PublicKey',
                        value: '',
                        valueImports: new ImportMap(),
                    };
                },

                visitPublicKeyValue(node) {
                    return {
                        ...typeManifest(),
                        value: `publicKey("${node.publicKey}")`,
                        valueImports: new ImportMap().add('umi', 'publicKey'),
                    };
                },

                visitRemainderOptionType(node) {
                    throw new KinobiError(KINOBI_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },

                visitSetType(setType, { self }) {
                    const childManifest = visit(setType.item, self);
                    childManifest.serializerImports.add('umiSerializers', 'set');
                    const sizeOption = getArrayLikeSizeOption(setType.count, childManifest, self);
                    const options = sizeOption ? `, { ${sizeOption} }` : '';
                    return {
                        ...childManifest,
                        looseType: `Set<${childManifest.looseType}>`,
                        serializer: `set(${childManifest.serializer + options})`,
                        strictType: `Set<${childManifest.strictType}>`,
                        value: '',
                        valueImports: new ImportMap(),
                    };
                },

                visitSetValue(node, { self }) {
                    const set = node.items.map(value => visit(value, self));
                    return {
                        ...typeManifest(),
                        value: `new Set([${set.map(c => c.value).join(', ')}])`,
                        valueImports: new ImportMap().mergeWith(...set.map(c => c.valueImports)),
                    };
                },

                visitSizePrefixType(sizePrefixType, { self }) {
                    parentSize = resolveNestedTypeNode(sizePrefixType.prefix);
                    const manifest = visit(sizePrefixType.type, self);
                    parentSize = null;
                    return manifest;
                },

                visitSolAmountType(solAmountType, { self }) {
                    const numberManifest = visit(solAmountType.number, self);
                    const nestedNumber = resolveNestedTypeNode(solAmountType.number);
                    if (!isUnsignedInteger(nestedNumber)) {
                        throw new Error(
                            `Amount wrappers can only be applied to unsigned ` +
                                `integer types. Got type [${nestedNumber.toString()}].`,
                        );
                    }
                    const idAndDecimals = `'SOL', 9`;
                    numberManifest.strictImports.add('umi', 'SolAmount');
                    numberManifest.looseImports.add('umi', 'SolAmount');
                    numberManifest.serializerImports.add('umi', 'mapAmountSerializer');
                    return {
                        ...numberManifest,
                        looseType: 'SolAmount',
                        serializer: `mapAmountSerializer(${numberManifest.serializer}, ${idAndDecimals})`,
                        strictType: 'SolAmount',
                    };
                },

                visitSomeValue(node, { self }) {
                    const child = visit(node.value, self);
                    return {
                        ...typeManifest(),
                        value: `some(${child.value})`,
                        valueImports: child.valueImports.add('umi', 'some'),
                    };
                },

                visitStringType(stringType, { self }) {
                    const looseImports = new ImportMap();
                    const strictImports = new ImportMap();
                    const serializerImports = new ImportMap().add('umiSerializers', 'string');
                    const options: string[] = [];

                    // Encoding option.
                    if (stringType.encoding !== 'utf8') {
                        looseImports.add('umiSerializers', stringType.encoding);
                        strictImports.add('umiSerializers', stringType.encoding);
                        options.push(`encoding: ${stringType.encoding}`);
                    }

                    // Size option.
                    if (!parentSize) {
                        options.push(`size: 'variable'`);
                    } else if (typeof parentSize === 'number') {
                        options.push(`size: ${parentSize}`);
                    } else if (parentSize.format !== 'u32' || parentSize.endian !== 'le') {
                        const prefix = visit(parentSize, self);
                        looseImports.mergeWith(prefix.looseImports);
                        strictImports.mergeWith(prefix.strictImports);
                        serializerImports.mergeWith(prefix.serializerImports);
                        options.push(`size: ${prefix.serializer}`);
                    }

                    const optionsAsString = options.length > 0 ? `{ ${options.join(', ')} }` : '';

                    return {
                        isEnum: false,
                        looseImports,
                        looseType: 'string',
                        serializer: `string(${optionsAsString})`,
                        serializerImports,
                        strictImports,
                        strictType: 'string',
                        value: '',
                        valueImports: new ImportMap(),
                    };
                },

                visitStringValue(node) {
                    return {
                        ...typeManifest(),
                        value: JSON.stringify(node.string),
                    };
                },

                visitStructFieldType(structFieldType, { self }) {
                    const name = camelCase(structFieldType.name);
                    const fieldChild = visit(structFieldType.type, self);
                    const docblock = structFieldType.docs.length > 0 ? `\n${jsDocblock(structFieldType.docs)}` : '';
                    const baseField = {
                        ...fieldChild,
                        looseType: `${docblock}${name}: ${fieldChild.looseType}; `,
                        serializer: `['${name}', ${fieldChild.serializer}]`,
                        strictType: `${docblock}${name}: ${fieldChild.strictType}; `,
                    };
                    if (!structFieldType.defaultValue) {
                        return baseField;
                    }
                    if (structFieldType.defaultValueStrategy !== 'omitted') {
                        return {
                            ...baseField,
                            looseType: `${docblock}${name}?: ${fieldChild.looseType}; `,
                        };
                    }
                    return {
                        ...baseField,
                        looseImports: new ImportMap(),
                        looseType: '',
                    };
                },

                visitStructFieldValue(node, { self }) {
                    const structValue = visit(node.value, self);
                    return {
                        ...structValue,
                        value: `${node.name}: ${structValue.value}`,
                    };
                },

                visitStructType(structType, { self }) {
                    const currentParentName = parentName;
                    parentName = null;

                    const fields = structType.fields.map(field => visit(field, self));
                    const mergedManifest = mergeManifests(fields);
                    mergedManifest.serializerImports.add('umiSerializers', 'struct');
                    const fieldSerializers = fields.map(field => field.serializer).join(', ');
                    const structDescription =
                        currentParentName?.strict && !currentParentName.strict.match(/['"<>]/)
                            ? `, { description: '${pascalCase(currentParentName.strict)}' }`
                            : '';
                    const serializerTypeParams = currentParentName ? currentParentName.strict : 'any';
                    const baseManifest = {
                        ...mergedManifest,
                        looseType: `{ ${fields.map(field => field.looseType).join('')} }`,
                        serializer: `struct<${serializerTypeParams}>` + `([${fieldSerializers}]${structDescription})`,
                        strictType: `{ ${fields.map(field => field.strictType).join('')} }`,
                        value: '',
                        valueImports: new ImportMap(),
                    };

                    const optionalFields = structType.fields.filter(f => !!f.defaultValue);
                    if (optionalFields.length === 0) {
                        return baseManifest;
                    }

                    const defaultValues = optionalFields
                        .map(f => {
                            const key = camelCase(f.name);
                            const defaultValue = f.defaultValue as NonNullable<typeof f.defaultValue>;
                            const { value: renderedValue, valueImports } = visit(defaultValue, self);
                            baseManifest.serializerImports.mergeWith(valueImports);
                            if (f.defaultValueStrategy === 'omitted') {
                                return `${key}: ${renderedValue}`;
                            }
                            return `${key}: value.${key} ?? ${renderedValue}`;
                        })
                        .join(', ');
                    const mapSerializerTypeParams = currentParentName
                        ? `${currentParentName.loose}, any, ${currentParentName.strict}`
                        : 'any, any, any';
                    const mappedSerializer =
                        `mapSerializer<${mapSerializerTypeParams}>(` +
                        `${baseManifest.serializer}, ` +
                        `(value) => ({ ...value, ${defaultValues} }) ` +
                        `)`;
                    baseManifest.serializerImports.add('umiSerializers', 'mapSerializer');
                    return { ...baseManifest, serializer: mappedSerializer };
                },

                visitStructValue(node, { self }) {
                    const struct = node.fields.map(field => visit(field, self));
                    return {
                        ...typeManifest(),
                        value: `{ ${struct.map(c => c.value).join(', ')} }`,
                        valueImports: new ImportMap().mergeWith(...struct.map(c => c.valueImports)),
                    };
                },

                visitTupleType(tupleType, { self }) {
                    const items = tupleType.items.map(item => visit(item, self));
                    const mergedManifest = mergeManifests(items);
                    mergedManifest.serializerImports.add('umiSerializers', 'tuple');
                    const itemSerializers = items.map(child => child.serializer).join(', ');
                    return {
                        ...mergedManifest,
                        looseType: `[${items.map(item => item.looseType).join(', ')}]`,
                        serializer: `tuple([${itemSerializers}])`,
                        strictType: `[${items.map(item => item.strictType).join(', ')}]`,
                        value: '',
                    };
                },

                visitTupleValue(node, { self }) {
                    const list = node.items.map(value => visit(value, self));
                    return {
                        ...typeManifest(),
                        value: `[${list.map(c => c.value).join(', ')}]`,
                        valueImports: new ImportMap().mergeWith(...list.map(c => c.valueImports)),
                    };
                },

                visitZeroableOptionType(node) {
                    throw new KinobiError(KINOBI_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },
            }),
    );
}

function mergeManifests(
    manifests: TypeManifest[],
): Pick<TypeManifest, 'isEnum' | 'looseImports' | 'serializerImports' | 'strictImports' | 'valueImports'> {
    return {
        isEnum: false,
        looseImports: new ImportMap().mergeWith(...manifests.map(td => td.looseImports)),
        serializerImports: new ImportMap().mergeWith(...manifests.map(td => td.serializerImports)),
        strictImports: new ImportMap().mergeWith(...manifests.map(td => td.strictImports)),
        valueImports: new ImportMap().mergeWith(...manifests.map(td => td.valueImports)),
    };
}

function getArrayLikeSizeOption(
    count: ArrayTypeNode['count'],
    manifest: Pick<TypeManifest, 'looseImports' | 'serializerImports' | 'strictImports'>,
    self: Visitor<TypeManifest, TypeNode['kind']>,
): string | null {
    if (isNode(count, 'fixedCountNode')) return `size: ${count.value}`;
    if (isNode(count, 'remainderCountNode')) return `size: 'remainder'`;

    const prefixManifest = visit(count.prefix, self);
    if (prefixManifest.serializer === 'u32()') return null;

    manifest.strictImports.mergeWith(prefixManifest.strictImports);
    manifest.looseImports.mergeWith(prefixManifest.looseImports);
    manifest.serializerImports.mergeWith(prefixManifest.serializerImports);
    return `size: ${prefixManifest.serializer}`;
}
