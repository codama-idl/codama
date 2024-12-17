import { getAllAccounts, getAllInstructionsWithSubs, getAllPrograms, isNode, VALUE_NODES } from '@codama/nodes';
import { RenderMap } from '@codama/renderers-core';
import {
    extendVisitor,
    LinkableDictionary,
    NodeStack,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    recordNodeStackVisitor,
    staticVisitor,
} from '@codama/visitors-core';

import { getImportFromFactory, LinkOverrides, render } from './utils';
import { renderValueNode } from './renderValueNodeVisitor';
import { ImportMap } from './ImportMap';

export type GetRenderMapOptions = {
    linkOverrides?: LinkOverrides;
    renderParentInstructions?: boolean;
    codamaSdkName?: string;
};

// Account node for the parser
type ParserAccountNode = {
    name: string;
};

// Instruction Accounts node for the parser
type ParserInstructionAccountNode = {
    name: string;
    index: number;
};

// Instruction node for the parser
type ParserInstructionNode = {
    discriminator: string | null;
    name: string;
    accounts: ParserInstructionAccountNode[];
    hasArgs: boolean;
};

export function getRenderMapVisitor(options: GetRenderMapOptions = {}) {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();

    const renderParentInstructions = options.renderParentInstructions ?? false;

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
                    const getImportFrom = getImportFromFactory(options.linkOverrides ?? {});
                    const programAccounts = getAllAccounts(node);
                    const accounts: ParserAccountNode[] = programAccounts.map(acc => {
                        return {
                            name: acc.name,
                        };
                    });
                    const programInstructions = getAllInstructionsWithSubs(node, {
                        leavesOnly: !renderParentInstructions,
                    });

                    // Default value for  Ix discriminator - 1 Byte
                    // Shank native program uses 1 byte
                    // anchor uses 8 bytes
                    let IX_DATA_OFFSET = 1;

                    const instructions: ParserInstructionNode[] = programInstructions.map(ix => {
                        // checs for discriminator
                        let discriminator = null;
                        let discriminatorIx = ix.arguments.find(arg => arg.name === 'discriminator');
                        if (discriminatorIx) {
                            const hasDefaultValue =
                                discriminatorIx.defaultValue && isNode(discriminatorIx.defaultValue, VALUE_NODES);

                            if (hasDefaultValue) {
                                const { imports: _, render: value } = renderValueNode(
                                    discriminatorIx.defaultValue,
                                    getImportFrom,
                                );

                                discriminator = value;

                                if (Array.isArray(JSON.parse(value))) {
                                    IX_DATA_OFFSET = Array.from(JSON.parse(value)).length;
                                } else {
                                    discriminator = `[${discriminator}]`;
                                }
                            }
                        }

                        return {
                            discriminator,
                            name: ix.name,
                            hasArgs: ix.arguments.length > 0,
                            accounts: ix.accounts.map((acc, accIdx) => {
                                return {
                                    name: acc.name,
                                    index: accIdx,
                                };
                            }),
                        };
                    });

                    // TODO: assuming name of codama generated sdk to be {program_name}_program_sdk for now need to change it
                    const codamaSdkName = options.codamaSdkName ?? `${toSnakeCase(programName)}_program_sdk`;

                    const accountParserImports = new ImportMap();

                    accounts.forEach(acc => {
                        accountParserImports.add(
                            `${codamaSdkName}::accounts::{${toSnakeCase(acc.name)}::${fromCamelToPascalCase(acc.name)}}`,
                        );
                    });

                    const instructionParserImports = new ImportMap();

                    instructionParserImports.add('borsh::{BorshDeserialize}');

                    const programIdImport = `${codamaSdkName}::ID`;

                    instructionParserImports.add(programIdImport);

                    accountParserImports.add(programIdImport);
                    let ixImports = '';

                    instructions.forEach(ix => {
                        const ixPascalName = fromCamelToPascalCase(ix.name);
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
                        imports: instructionParserImports,
                        programName,
                        accounts,
                        hasDiscriminator: instructions.some(ix => ix.discriminator !== null),
                        instructions,
                        IX_DATA_OFFSET,
                    };

                    const accCtx = {
                        imports: accountParserImports,
                        programName,
                        accounts,
                    };

                    const map = new RenderMap();

                    // only two files are generated as part of account and instruction parser

                    if (accCtx.accounts.length > 0) {
                        map.add('accounts_parser.rs', render('accountsParserPage.njk', accCtx));
                    }

                    if (ixCtx.instructions.length > 0) {
                        map.add('instructions_parser.rs', render('instructionsParserPage.njk', ixCtx));
                    }

                    map.add(
                        'mod.rs',
                        render('rootMod.njk', {
                            hasAccounts: accCtx.accounts.length > 0,
                        }),
                    );

                    return map;
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}

export const fromCamelToPascalCase = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toPascalCase = (str: string) => {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toUpperCase() : word.toLowerCase();
        })
        .replace(/\s+/g, '');
};

export const toSnakeCase = (str: string) => {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : `_${word.toLowerCase()}`;
        })
        .replace(/\s+/g, '');
};
