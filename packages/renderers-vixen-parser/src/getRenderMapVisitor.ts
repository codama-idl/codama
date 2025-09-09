import {
    AccountNode,
    // BytesValueNode,
    DefinedTypeLinkNode,
    DefinedTypeNode,
    EnumTypeNode,
    EnumVariantTypeNode,
    getAllAccounts,
    getAllDefinedTypes,
    getAllInstructionsWithSubs,
    InstructionArgumentNode,
    InstructionNode,
    NumberTypeNode,
    pascalCase,
    resolveNestedTypeNode,
    snakeCase,
    StructFieldTypeNode,
    titleCase,
    TypeNode,
} from '@codama/nodes';
import { addToRenderMap, createRenderMap } from '@codama/renderers-core';
import {
    extendVisitor,
    LinkableDictionary,
    NodeStack,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    recordNodeStackVisitor,
    staticVisitor,
    visit,
} from '@codama/visitors-core';

import {
    checkArrayTypeAndFix,
    getProtoTypeManifestVisitor,
    numberTypeToProtoHelper,
} from './getProtoTypeManifestVisitor';
import { ImportMap } from './ImportMap';
import { getBytesFromBytesValueNode, getImportFromFactory, render } from './utils';

export type GetRenderMapOptions = {
    generateProto?: boolean;
    projectCrateDescription?: string;
    projectFolder: string;
    projectName: string;
};

// Account node for the parser
type ParserAccountNode = {
    discriminator: string | null;
    fields: {
        name: string;
        transform: string;
    }[];
    name: string;
    size: number | null;
};

// Instruction Accounts node for the parser
type ParserInstructionAccountNode = {
    index: number;
    name: string;
};

// Instruction node for the parser
type ParserInstructionNode = {
    accounts: ParserInstructionAccountNode[];
    discriminator: string | null;
    hasArgs: boolean;
    ixArgs: {
        name: string;
        transform: string;
    }[];
    name: string;
    totalOptionalOmittedAccounts: number;
};

function getInnerDefinedTypeTransform(
    type: DefinedTypeLinkNode,
    outerTypeName: string,
    idlDefinedTypes: DefinedTypeNode[],
): string {
    const fieldTypeName = type.name;
    const definedType = idlDefinedTypes.find(dt => dt.name === fieldTypeName);
    if (!definedType) {
        throw new Error(`Defined type ${fieldTypeName} not found`);
    }

    if (definedType.type.kind === 'structTypeNode') {
        return `Some(self.${outerTypeName}.into_proto())`;
    } else if (definedType.type.kind === 'enumTypeNode') {
        return isEnumEmptyVariant(definedType.type)
            ? `self.${outerTypeName} as i32`
            : `Some(self.${outerTypeName}.into_proto())`;
    } else {
        throw new Error(`Defined type ${fieldTypeName} is not a struct or enum`);
    }
}

function getInnerDefinedTypeTransformForEnumVariant(
    type: DefinedTypeLinkNode,
    outerTypeName: string,
    idlDefinedTypes: DefinedTypeNode[],
): string {
    const fieldTypeName = type.name;
    const definedType = idlDefinedTypes.find(dt => dt.name === fieldTypeName);
    if (!definedType) {
        throw new Error(`Defined type ${fieldTypeName} not found`);
    }

    if (definedType.type.kind === 'structTypeNode') {
        return `self.${outerTypeName}.into_proto()`;
    } else if (definedType.type.kind === 'enumTypeNode') {
        return isEnumEmptyVariant(definedType.type)
            ? `self.${outerTypeName} as i32`
            : `self.${outerTypeName}.into_proto()`;
    } else {
        throw new Error(`Defined type ${fieldTypeName} is not a struct or enum`);
    }
}

export function isEnumEmptyVariant(type: EnumTypeNode) {
    return type.variants.reduce((acc, variant) => acc && variant.kind === 'enumEmptyVariantTypeNode', true);
}

export function getEnumTypeTransform(_type: EnumTypeNode, _outerTypeName: string) {}

function getNumberTypeTransform(type: NumberTypeNode) {
    switch (type.format) {
        case 'u128':
        case 'i128': {
            return `.to_string()`;
        }

        case 'u8':
        case 'u16':
            return `.into()`;

        default:
            return ``;
    }
}

// TODO!: Make this function use getTransform() for the inner items
function getArrayTypeTransform(item: TypeNode, outerTypeName: string, idlDefinedTypes: DefinedTypeNode[]) {
    switch (item.kind) {
        case 'definedTypeLinkNode': {
            const definedType = idlDefinedTypes.find(dt => dt.name === item.name);
            if (!definedType) {
                throw new Error(`Defined type ${item.name} not found`);
            }
            const isdefinedTypeLinkNodeEnum = definedType.type.kind === 'enumTypeNode';

            // Empty VariantEnum type handling
            if (isdefinedTypeLinkNodeEnum && isEnumEmptyVariant(definedType.type)) {
                return `self.${outerTypeName}.into_iter().map(|x| x as i32).collect()`;
            } else {
                return `self.${outerTypeName}.into_iter().map(|x| x.into_proto()).collect()`;
            }
        }

        // Matrix case
        case 'arrayTypeNode': {
            const matrixItemKind = item.item.kind;
            switch (matrixItemKind) {
                case 'numberTypeNode': {
                    const protoTypeName = numberTypeToProtoHelper(item.item);
                    const helperTypeName = `Repeated${titleCase(protoTypeName)}Row`;

                    return `self.${outerTypeName}.into_iter().map(|x| proto_def::${helperTypeName} { rows: x.to_vec() }).collect()`;
                }
                default: {
                    throw new Error(`Unsupported matrix item kind: ${matrixItemKind}`);
                }
            }
        }

        case 'numberTypeNode': {
            const innerTansform = getNumberTypeTransform(item);
            if (innerTansform === '') {
                return `self.${outerTypeName}.to_vec()`;
            } else {
                return `self.${outerTypeName}.into_iter().map(|x| x${innerTansform}).collect()`;
            }
        }

        case 'publicKeyTypeNode': {
            return `self.${outerTypeName}.into_iter().map(|x| x.to_string()).collect()`;
        }

        case 'bytesTypeNode': {
            return `self.${outerTypeName}.into_iter().map(|x| x.into()).collect()`;
        }

        default:
            console.warn(`Warning!: Default case for array type: ${item.kind} for type ${outerTypeName}`);
            return `self.${outerTypeName}.to_vec()`;
    }
}

function getOptionTypeTransform(
    item: TypeNode,
    outerTypeName: string,
    idlDefinedTypes: DefinedTypeNode[],
    options: { isEnumVariant: boolean },
) {
    const innerTransform = getTransform(item, outerTypeName, idlDefinedTypes, options);
    const cleanedTransform = innerTransform.replace(`self.${outerTypeName}`, 'x');

    switch (cleanedTransform) {
        case 'x':
            return `self.${outerTypeName}`;
        case 'Some(x.into_proto())':
            return `self.${outerTypeName}.map(|x| x.into_proto())`;
        default:
            return `self.${outerTypeName}.map(|x| ${cleanedTransform})`;
    }
}

function getTransform(
    type: TypeNode,
    name: string,
    idlDefinedTypes: DefinedTypeNode[],
    options = { isEnumVariant: false },
): string {
    const typeName = snakeCase(name);

    switch (type.kind) {
        case 'definedTypeLinkNode': {
            return options.isEnumVariant
                ? getInnerDefinedTypeTransformForEnumVariant(type, typeName, idlDefinedTypes)
                : getInnerDefinedTypeTransform(type, typeName, idlDefinedTypes);
        }

        case 'arrayTypeNode':
            return getArrayTypeTransform(type.item, typeName, idlDefinedTypes);

        case 'fixedSizeTypeNode':
            return getArrayTypeTransform(type.type, typeName, idlDefinedTypes);

        case 'publicKeyTypeNode':
            return `self.${typeName}.to_string()`;

        case 'optionTypeNode':
            return getOptionTypeTransform(type.item, typeName, idlDefinedTypes, options);

        case 'numberTypeNode':
            return `self.${typeName}${getNumberTypeTransform(type)}`;

        default:
            return `self.${typeName}`;
    }
}

function getEnumVariantTransform(variant: EnumVariantTypeNode, idlDefinedTypes: DefinedTypeNode[]): [string, string] {
    switch (variant.kind) {
        case 'enumEmptyVariantTypeNode': {
            return ['', ''];
        }

        case 'enumStructVariantTypeNode': {
            if (variant.struct.kind === 'structTypeNode') {
                const variantFields = variant.struct.fields.reduce(
                    (acc, field) => `${acc}${snakeCase(field.name)}, `,
                    '',
                );
                const fieldsTransformMap = variant.struct.fields.map(field => [
                    snakeCase(field.name),
                    getTransform(field.type, field.name, idlDefinedTypes, { isEnumVariant: true }),
                ]);
                const fieldsTransformString = fieldsTransformMap.reduce((acc, [fieldName, transform]) => {
                    const transformWithoutSelfPrefix = transform.replace(/^self\./, '');
                    if (transformWithoutSelfPrefix === fieldName) {
                        return `${acc}${transformWithoutSelfPrefix}, `;
                    }
                    if (transformWithoutSelfPrefix === `${fieldName}.into_proto()`) {
                        return `${acc}${fieldName}: Some(${transformWithoutSelfPrefix}), `;
                    }
                    return `${acc}${fieldName}: ${transformWithoutSelfPrefix}, `;
                }, '');

                return [`{ ${variantFields} }`, fieldsTransformString];
            } else {
                throw new Error(`Unsupported enum variant type: ${variant.kind}`);
            }
        }

        case 'enumTupleVariantTypeNode': {
            if (variant.tuple.kind !== 'tupleTypeNode') {
                throw new Error(`Unsupported enum variant type: ${variant.tuple.kind}`);
            }

            const variantFields = variant.tuple.items.reduce((acc, _field, i) => `${acc}field_${i}, `, '');

            const fieldsTransformMap = variant.tuple.items.map((field, i) => [
                `field_${i}`,
                getTransform(field, `field_${i}`, idlDefinedTypes, { isEnumVariant: true }),
            ]);
            const fieldsTransformString = fieldsTransformMap.reduce((acc, [fieldName, transform]) => {
                const transformWithoutSelfPrefix = transform.replace(/^self\./, '');
                if (transformWithoutSelfPrefix === fieldName) {
                    return `${acc}${transformWithoutSelfPrefix}, `;
                }
                if (transformWithoutSelfPrefix === `${fieldName}.into_proto()`) {
                    return `${acc}${fieldName}: Some(${transformWithoutSelfPrefix}), `;
                }
                return `${acc}${fieldName}: ${transformWithoutSelfPrefix}, `;
            }, '');

            return [`(${variantFields})`, fieldsTransformString];
        }

        default:
            throw new Error(`Unsupported enum variant type`);
    }
}

const getFieldDiscriminator = (discriminatorValue: InstructionArgumentNode | StructFieldTypeNode): string[] => {
    let discriminator: string[];

    if (
        discriminatorValue.type.kind === 'fixedSizeTypeNode' &&
        discriminatorValue.name === 'discriminator' &&
        discriminatorValue.type.type.kind === 'bytesTypeNode' &&
        discriminatorValue.defaultValue &&
        discriminatorValue.defaultValue.kind === 'bytesValueNode' &&
        discriminatorValue.defaultValue.encoding === 'base16'
    ) {
        // bytesTypeNode Discriminator
        discriminator = Array.from(getBytesFromBytesValueNode(discriminatorValue.defaultValue)).map(v => v.toString());

        if (discriminator.length !== discriminatorValue.type.size) {
            throw new Error('Invalid discriminator length');
        }
    } else if (
        discriminatorValue.type.kind === 'numberTypeNode' &&
        discriminatorValue.type.endian === 'le' &&
        discriminatorValue.defaultValue &&
        discriminatorValue.defaultValue.kind === 'numberValueNode'
    ) {
        // numberTypeNode Discriminator
        const discriminatorValueNumber = discriminatorValue.defaultValue.number;
        const discriminatorSize = getBytesLenFromNumberFormat(discriminatorValue.type);

        discriminator = getDiscriminatorArrayFromNumberTypeDiscriminator(discriminatorSize, discriminatorValueNumber);
    } else {
        throw new Error(`"${discriminatorValue.name}" does not have a supported discriminator`);
    }

    return discriminator;
};

const getBytesLenFromNumberFormat = (type: NumberTypeNode): number => {
    const firstChar = type.format[0];
    if (firstChar !== 'u') {
        throw new Error(`Unsupported number type discriminator format: ${type.format}`);
    }

    return parseInt(type.format.slice(1), 10) / 8;
};

const getDiscriminatorArrayFromNumberTypeDiscriminator = (bytesLength: number, value: number): string[] => {
    const buffer = new ArrayBuffer(bytesLength);
    const view = new DataView(buffer);

    // Write the number to the buffer based on its size
    switch (bytesLength) {
        case 1:
            view.setUint8(0, value);
            break;
        case 2:
            view.setUint16(0, value, true); // true = little-endian
            break;
        case 4:
            view.setUint32(0, value, true); // true = little-endian
            break;
        case 8:
            view.setBigUint64(0, BigInt(value), true); // true = little-endian
            break;
        default:
            throw new Error(`Unsupported number type discriminator size: ${bytesLength}`);
    }

    // Convert the buffer to an array of byte values as strings
    return Array.from(new Uint8Array(buffer)).map(byte => byte.toString());
};

/** Currenty only supports one discriminator per account, being in the discriminator field and at the start of the data.
 * If not present or `sizeDiscriminator` is set, defaults to account LEN strategy.
 */
const getAccountSizeOrFieldDiscriminator = (node: AccountNode): string[] | null => {
    const discriminators = node.discriminators;
    // If not discriminator set, default to account LEN strategy
    if (!discriminators || discriminators.length === 0) {
        return null;
    }
    if (discriminators.length != 1) {
        throw new Error(`Account "${node.name}" does not have a supported discriminator`);
    }
    const discriminatorType = discriminators[0];
    if (discriminatorType.kind === 'sizeDiscriminatorNode') {
        return null;
    } else if (
        discriminatorType.kind !== 'fieldDiscriminatorNode' ||
        discriminatorType.name !== 'discriminator' ||
        discriminatorType.offset !== 0
    ) {
        throw new Error(`Account "${node.name}" does not have a supported discriminator`);
    }

    const discriminatorValue = resolveNestedTypeNode(node.data).fields[0];

    return getFieldDiscriminator(discriminatorValue);
};

/** Currenty only supports one discriminator per instruction, being in the discriminator field and at the start of the arguments */
const getIxFieldDiscriminator = (node: InstructionNode) => {
    const notSupportedDiscriminatorError = `Instruction "${node.name}" does not have a supported discriminator`;
    const discriminators = node.discriminators;
    if (!discriminators || discriminators.length != 1) {
        throw new Error(notSupportedDiscriminatorError);
    }

    const discriminatorType = discriminators[0];

    if (
        discriminatorType.kind !== 'fieldDiscriminatorNode' ||
        discriminatorType.name !== 'discriminator' ||
        discriminatorType.offset !== 0
    ) {
        throw new Error(notSupportedDiscriminatorError);
    }

    const discriminatorValue = node.arguments[0];

    return getFieldDiscriminator(discriminatorValue);
};

export function getRenderMapVisitor(options: GetRenderMapOptions) {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();
    const getImportFrom = getImportFromFactory({});
    const getTraitsFromNode = (_node: AccountNode | DefinedTypeNode) => {
        return { imports: new ImportMap(), render: '' };
    };
    const typeManifestVisitor = getProtoTypeManifestVisitor({ getImportFrom, getTraitsFromNode });

    return pipe(
        staticVisitor(() => createRenderMap(), {
            keys: ['rootNode', 'programNode', 'instructionNode', 'accountNode', 'definedTypeNode'],
        }),
        v =>
            extendVisitor(v, {
                visitRoot(node) {
                    //TODO: handle multiple programs
                    const program = node.program;

                    const programName = program?.name;

                    const programAccounts = getAllAccounts(node);
                    const types = getAllDefinedTypes(node);

                    let accDiscLen: number | undefined;
                    let hasAccountDiscriminator = false;

                    const accounts: ParserAccountNode[] = programAccounts.map(acc => {
                        const accData = resolveNestedTypeNode(acc.data);
                        const discriminator = getAccountSizeOrFieldDiscriminator(acc);

                        if (discriminator === null) {
                            if (hasAccountDiscriminator) {
                                throw new Error(
                                    'All discriminators should be null if there is already a null discriminator',
                                );
                            }
                        } else {
                            hasAccountDiscriminator = true;
                            if (accDiscLen && accDiscLen !== discriminator.length) {
                                throw new Error('All accounts discriminators should have the same length');
                            }
                            accDiscLen = discriminator.length;
                        }

                        return {
                            discriminator: discriminator ? `[${discriminator.join(', ')}]` : null,
                            fields: accData.fields
                                .filter(field => field.name !== 'discriminator')
                                .map(field => {
                                    return {
                                        name: snakeCase(field.name),
                                        transform: getTransform(field.type, field.name, types),
                                    };
                                }),
                            name: acc.name,
                            size: acc.size?.valueOf() ?? null,
                        };
                    });

                    const programInstructions = getAllInstructionsWithSubs(node, {
                        leavesOnly: true,
                    });

                    // Instructions
                    let ixDiscLen: number | undefined;

                    const instructions: ParserInstructionNode[] = programInstructions.map(ix => {
                        const discriminator = getIxFieldDiscriminator(ix);
                        if (ixDiscLen && ixDiscLen !== discriminator.length) {
                            throw new Error('All ixs discriminators should have the same length');
                        }
                        ixDiscLen = discriminator.length;

                        const hasArgs = ix.arguments.length > 1;

                        const totalOptionalOmittedAccounts = ix.accounts.filter(
                            acc => acc.isOptional && ix.optionalAccountStrategy === 'omitted',
                        ).length;

                        const ixArgs = ix.arguments
                            .filter(arg => arg.name !== 'discriminator')
                            .map(arg => {
                                return {
                                    name: snakeCase(arg.name),
                                    transform: getTransform(arg.type, arg.name, types),
                                };
                            });

                        return {
                            accounts: ix.accounts.map((acc, accIdx) => {
                                return {
                                    index: accIdx,
                                    isOptional: acc.isOptional,
                                    name: snakeCase(acc.name),
                                };
                            }),
                            discriminator: `[${discriminator.join(', ')}]`,
                            hasArgs,
                            ixArgs,
                            name: ix.name,
                            optionalAccountStrategy: ix.optionalAccountStrategy,
                            totalOptionalOmittedAccounts,
                        };
                    });

                    if (!options.projectName) {
                        throw new Error('projectName is required');
                    }
                    const projectName = `yellowstone-vixen-${options.projectName}-parser`;

                    const accountParserImports = new ImportMap();

                    accounts.forEach(acc => {
                        accountParserImports.add(`crate::accounts::${pascalCase(acc.name)}`);
                    });

                    const instructionParserImports = new ImportMap();

                    const programIdImport = `crate::ID`;

                    instructionParserImports.add(programIdImport);

                    accountParserImports.add(programIdImport);
                    let ixImports = '';

                    instructions.forEach(ix => {
                        const ixPascalName = pascalCase(ix.name);
                        const ixAccounts = `${ixPascalName} as ${ixPascalName}IxAccounts`;
                        if (ix.hasArgs) {
                            // Adding alias for IxData
                            const ixData = `${ixPascalName}InstructionArgs as ${ixPascalName}IxData`;

                            ixImports = ixImports + `${ixData}, `;
                            ixImports = ixImports + `${ixAccounts}, `;
                        } else {
                            ixImports = ixImports + `${ixAccounts}, `;
                        }
                    });

                    instructionParserImports.add(`crate::instructions::{${ixImports}}`);
                    let renderMap = createRenderMap();

                    const programStateOneOf: string[] = [];

                    let hasProtoHelpers = false;

                    const protoProjectName = snakeCase(options.projectName);

                    if (options.generateProto !== false) {
                        const definedTypes: string[] = [];
                        // proto Ixs , Accounts and Types
                        const matrixTypes: Set<string> = new Set();

                        const protoAccounts = programAccounts.map((acc, i) => {
                            programStateOneOf.push(`\t${pascalCase(acc.name)} ${snakeCase(acc.name)} = ${i + 1};`);

                            const node = visit(acc, typeManifestVisitor);
                            if (node.definedTypes) {
                                definedTypes.push(node.definedTypes);
                            }
                            return checkArrayTypeAndFix(node.type, matrixTypes);
                        });

                        const protoTypesHelpers: { fields: { name: string; transform: string }[]; name: string }[] = [];
                        const protoTypesHelpersEnums: {
                            name: string;
                            variants: { fields_transform: string; name: string; variant_fields: string }[];
                        }[] = [];

                        const protoTypes = types.map(type => {
                            const node = visit(type, typeManifestVisitor);

                            if (node.definedTypes) {
                                definedTypes.push(node.definedTypes);
                            }

                            if (type.type.kind === 'structTypeNode') {
                                const fields = type.type.fields.map(field => {
                                    return {
                                        name: snakeCase(field.name),
                                        transform: getTransform(field.type, field.name, types),
                                    };
                                });

                                protoTypesHelpers.push({
                                    fields,
                                    name: type.name,
                                });
                            } else if (type.type.kind === 'enumTypeNode' && !isEnumEmptyVariant(type.type)) {
                                // Only need for additional `IntoProto` implementations for non-empty variants enums (otherwhise
                                //  they are automatically treated as i32 by tonic genereted types)

                                const variants = type.type.variants.map(variant => {
                                    const [variant_fields, fields_transform] = getEnumVariantTransform(variant, types);
                                    return {
                                        fields_transform,
                                        name: snakeCase(variant.name),
                                        variant_fields,
                                    };
                                });

                                protoTypesHelpersEnums.push({
                                    name: type.name,
                                    variants,
                                });
                            }

                            return checkArrayTypeAndFix(node.type, matrixTypes);
                        });

                        const protoIxs: {
                            accounts: string;
                            args: string;
                        }[] = [];

                        const programIxsOneOf: string[] = [];
                        let ixIdx = 0;

                        for (const ix of programInstructions) {
                            const ixName = ix.name;
                            const ixAccounts = ix.accounts
                                .map((acc, idx) => {
                                    if (!acc.isOptional) {
                                        return `\tstring ${snakeCase(acc.name)} = ${idx + 1};`;
                                    } else {
                                        return `\toptional string ${snakeCase(acc.name)} = ${idx + 1};`;
                                    }
                                })
                                .join('\n');

                            programIxsOneOf.push(`\t${pascalCase(ixName)}Ix ${snakeCase(ixName)} = ${ixIdx + 1};`);
                            ixIdx++;

                            let idx = 0;

                            const ixArgs = ix.arguments
                                .map(arg => {
                                    const node = visit(arg.type, typeManifestVisitor);

                                    if (arg.name === 'discriminator') {
                                        return '';
                                    }

                                    if (node.definedTypes) {
                                        definedTypes.push(node.definedTypes);
                                    }
                                    const argType = checkArrayTypeAndFix(node.type, matrixTypes);

                                    idx++;

                                    return `\t${argType} ${snakeCase(arg.name)} = ${idx};`;
                                })
                                .filter(arg => arg !== '')
                                .join('\n');

                            if (ixArgs.length === 0) {
                                protoIxs.push({
                                    accounts: `message ${pascalCase(ixName)}IxAccounts {\n${ixAccounts}\n}\n`,
                                    args: '',
                                });

                                const ixStruct = `message ${pascalCase(ixName)}Ix {\n\t${pascalCase(ixName)}IxAccounts accounts = 1;\n}\n`;

                                definedTypes.push(ixStruct);
                            } else {
                                protoIxs.push({
                                    accounts: `message ${pascalCase(ixName)}IxAccounts {\n${ixAccounts}\n}\n`,
                                    args: `message ${pascalCase(ixName)}IxData {\n${ixArgs}\n}\n`,
                                });

                                const ixStruct = `message ${pascalCase(ixName)}Ix {\n\t${pascalCase(ixName)}IxAccounts accounts = 1;\n\t${pascalCase(ixName)}IxData data = 2;\n}\n`;
                                definedTypes.push(ixStruct);
                            }
                        }

                        const matrixProtoTypes = Array.from(matrixTypes).map(type => {
                            return `message Repeated${titleCase(type)}Row {\n\trepeated ${type} rows = 1;\n}\n`;
                        });

                        definedTypes.push(...matrixProtoTypes);

                        renderMap = addToRenderMap(
                            renderMap,
                            `proto/${protoProjectName}.proto`,
                            render('proto.njk', {
                                accounts: protoAccounts,
                                definedTypes,
                                instructions: protoIxs,
                                programIxsOneOf,
                                programName,
                                programStateOneOf,
                                protoProjectName,
                                types: protoTypes,
                            }),
                        );

                        if (protoTypesHelpers.length > 0 || protoTypesHelpersEnums.length > 0) {
                            hasProtoHelpers = true;

                            const normalizeAcronyms = (str: string) => {
                                return str.replace(/([A-Z]{2,})(?=[A-Z][a-z0-9]|[^A-Za-z]|$)/g, function (match) {
                                    return match.charAt(0) + match.slice(1).toLowerCase();
                                });
                            };

                            renderMap = addToRenderMap(
                                renderMap,
                                `src/generated_parser/proto_helpers.rs`,
                                render('protoHelpersPage.njk', {
                                    normalizeAcronyms,
                                    protoTypesHelpers,
                                    protoTypesHelpersEnums,
                                }),
                            );
                        }
                    }

                    const ixCtx = {
                        accounts,
                        hasProtoHelpers,
                        imports: instructionParserImports,
                        instructions,
                        ixDiscLen,
                        programName,
                    };

                    const accCtx = {
                        accDiscLen,
                        accounts,
                        hasDiscriminator: hasAccountDiscriminator,
                        hasProtoHelpers,
                        imports: accountParserImports,
                        programName,
                    };

                    // only two files are generated as part of account and instruction parser
                    if (accCtx.accounts.length > 0) {
                        renderMap = addToRenderMap(
                            renderMap,
                            `src/generated_parser/accounts_parser.rs`,
                            render('accountsParserPage.njk', accCtx),
                        );
                    }

                    if (ixCtx.instructions.length > 0) {
                        renderMap = addToRenderMap(
                            renderMap,
                            `src/generated_parser/instructions_parser.rs`,
                            render('instructionsParserPage.njk', ixCtx),
                        );
                    }

                    return pipe(
                        renderMap,
                        r =>
                            addToRenderMap(
                                r,
                                `src/generated_parser/mod.rs`,
                                render('rootMod.njk', {
                                    hasAccounts: accCtx.accounts.length > 0,
                                    hasProtoHelpers,
                                }),
                            ),
                        r =>
                            addToRenderMap(
                                r,
                                'src/lib.rs',
                                render('libPage.njk', {
                                    programId: node.program.name,
                                    protoProjectName,
                                }),
                            ),
                        r => addToRenderMap(r, 'build.rs', render('buildPage.njk', { protoProjectName })),
                        r =>
                            addToRenderMap(
                                r,
                                'Cargo.toml',
                                render('CargoPage.njk', {
                                    projectCrateDescription: options.projectCrateDescription,
                                    projectName,
                                }),
                            ),
                    );
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
