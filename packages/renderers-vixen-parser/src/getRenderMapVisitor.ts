import {
    AccountNode,
    DefinedTypeNode,
    getAllAccounts,
    getAllDefinedTypes,
    getAllInstructionsWithSubs,
    getAllPrograms,
    isNode,
    pascalCase,
    resolveNestedTypeNode,
    snakeCase,
    titleCase,
    VALUE_NODES,
} from '@codama/nodes';
import { RenderMap } from '@codama/renderers-core';
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

import { checkArrayTypeAndFix, getProtoTypeManifestVisitor } from './getProtoTypeManifestVisitor';
import { ImportMap } from './ImportMap';
import { renderValueNode } from './renderValueNodeVisitor';
import { getImportFromFactory, LinkOverrides, render } from './utils';

export type GetRenderMapOptions = {
    generateProto?: boolean;
    linkOverrides?: LinkOverrides;
    renderParentInstructions?: boolean;
    sdkName?: string;
    project?: string;
};

// Account node for the parser
type ParserAccountNode = {
    name: string;
    size: number | null;
    fields: string[];
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
    name: string;
    hasOptionalAccounts: boolean;
    ixArgs: string[];
};

export function getRenderMapVisitor(options: GetRenderMapOptions = {}) {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();
    const renderParentInstructions = options.renderParentInstructions ?? false;
    const getImportFrom = getImportFromFactory(options.linkOverrides ?? {});
    const getTraitsFromNode = (_node: AccountNode | DefinedTypeNode) => {
        return { imports: new ImportMap(), render: '' };
    };
    const typeManifestVisitor = getProtoTypeManifestVisitor({ getImportFrom, getTraitsFromNode });

    return pipe(
        staticVisitor(() => new RenderMap(), {
            keys: ['rootNode', 'programNode', 'instructionNode', 'accountNode', 'definedTypeNode'],
        }),
        v =>
            extendVisitor(v, {
                visitRoot(node) {
                    const programsToExport = getAllPrograms(node);
                    //TODO: handle multiple programs
                    const programName = programsToExport[0]?.name;

                    const programAccounts = getAllAccounts(node);
                    const types = getAllDefinedTypes(node);

                    // States
                    const accounts: ParserAccountNode[] = programAccounts.map(acc => {
                        const accData = resolveNestedTypeNode(acc.data);
                        return {
                            name: acc.name,
                            size: acc.size?.valueOf() ?? null,
                            fields: accData.fields
                                .map(field => snakeCase(field.name))
                                .filter(field => field !== 'discriminator'),
                        };
                    });

                    const programInstructions = getAllInstructionsWithSubs(node, {
                        leavesOnly: !renderParentInstructions,
                    });

                    // Default value for  Ix discriminator - 1 Byte
                    // Shank native program uses 1 byte
                    // anchor uses 8 bytes
                    let IX_DATA_OFFSET = 1;

                    // Instructions
                    const instructions: ParserInstructionNode[] = programInstructions.map(ix => {
                        // checs for discriminator
                        let discriminator: string[] | string | null = null;
                        const discriminatorIx = ix.arguments.find(arg => arg.name === 'discriminator');
                        if (discriminatorIx) {
                            const hasDefaultValue =
                                discriminatorIx.defaultValue && isNode(discriminatorIx.defaultValue, VALUE_NODES);

                            if (hasDefaultValue) {
                                const { render: value } = renderValueNode(discriminatorIx.defaultValue, getImportFrom);

                                discriminator = value;

                                if (Array.isArray(JSON.parse(value) as string[])) {
                                    IX_DATA_OFFSET = Array.from(JSON.parse(value) as string[]).length;
                                } else {
                                    discriminator = `[${discriminator}]`;
                                }
                            }
                        }

                        const hasArgs = discriminator ? ix.arguments.length > 1 : ix.arguments.length > 0;
                        const hasOptionalAccounts = ix.accounts.some(acc => acc.isOptional);
                        const ixArgs = ix.arguments
                            .map(arg => snakeCase(arg.name))
                            .filter(arg => arg !== 'discriminator');

                        return {
                            accounts: ix.accounts.map((acc, accIdx) => {
                                return {
                                    index: accIdx,
                                    isOptional: acc.isOptional,
                                    name: snakeCase(acc.name),
                                };
                            }),
                            discriminator,
                            hasArgs,
                            hasOptionalAccounts,
                            ixArgs,
                            name: ix.name,
                            optionalAccountStrategy: ix.optionalAccountStrategy,
                        };
                    });

                    if (!options.sdkName) {
                        throw new Error('sdkName is required');
                    }

                    if (!options.project) {
                        throw new Error('programName is required');
                    }

                    const projectName = options.project;

                    const codamaSdkName = snakeCase(options.sdkName);

                    const accountParserImports = new ImportMap();

                    accounts.forEach(acc => {
                        accountParserImports.add(`${codamaSdkName}::accounts::${pascalCase(acc.name)}`);
                    });

                    const instructionParserImports = new ImportMap();

                    instructionParserImports.add('borsh::{BorshDeserialize}');

                    const programIdImport = `${codamaSdkName}::ID`;

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

                    instructionParserImports.add(`${codamaSdkName}::instructions::{${ixImports}}`);

                    const ixCtx = {
                        IX_DATA_OFFSET,
                        accounts,
                        hasDiscriminator: instructions.some(ix => ix.discriminator !== null),
                        imports: instructionParserImports,
                        instructions,
                        programName,
                    };

                    const accCtx = {
                        accounts,
                        imports: accountParserImports,
                        programName,
                    };

                    const map = new RenderMap();

                    // only two files are generated as part of account and instruction parser
                    if (accCtx.accounts.length > 0) {
                        map.add('src/generated/accounts_parser.rs', render('accountsParserPage.njk', accCtx));
                    }

                    if (ixCtx.instructions.length > 0) {
                        map.add('src/generated/instructions_parser.rs', render('instructionsParserPage.njk', ixCtx));
                    }

                    if (
                        map.has('src/generated/accounts_parser.rs') ||
                        map.has('src/generated/instructions_parser.rs')
                    ) {
                    }

                    if (options.generateProto) {
                        const definedTypes: string[] = [];
                        // proto Ixs , Accounts and Types
                        const matrixTypes: Set<string> = new Set();

                        const protoAccounts = programAccounts.map(acc => {
                            const node = visit(acc, typeManifestVisitor);
                            if (node.definedTypes) {
                                definedTypes.push(node.definedTypes);
                            }
                            return checkArrayTypeAndFix(node.type, matrixTypes);
                        });

                        const protoTypes = types.map(type => {
                            const node = visit(type, typeManifestVisitor);
                            if (node.definedTypes) {
                                definedTypes.push(node.definedTypes);
                            }
                            return checkArrayTypeAndFix(node.type, matrixTypes);
                        });

                        const protoIxs: {
                            accounts: string;
                            args: string;
                        }[] = [];

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

                        map.add(
                            'proto/proto_def.proto',
                            render('proto.njk', {
                                accounts: protoAccounts,
                                definedTypes,
                                instructions: protoIxs,
                                types: protoTypes,
                            }),
                        );
                    }

                    map.add(
                        'src/generated/mod.rs',
                        render('rootMod.njk', {
                            hasAccounts: accCtx.accounts.length > 0,
                        }),
                    );

                    map.add('src/lib.rs', render('libPage.njk'));

                    map.add('build.rs', render('buildPage.njk'));

                    map.add('Cargo.toml', render('CargoPage.njk', { projectName: projectName }));

                    return map;
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
