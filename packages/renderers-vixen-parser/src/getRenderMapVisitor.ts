import {
    getAllAccounts,
    getAllInstructionsWithSubs,
    isNode,
    pascalCase,
    ProgramNode,
    snakeCase,
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
} from '@codama/visitors-core';

import * as crypto from 'crypto';
import { ImportMap } from './ImportMap';
import { renderValueNode } from './renderValueNodeVisitor';
import { getImportFromFactory, LinkOverrides, render } from './utils';

export type GetRenderMapOptions = {
    linkOverrides?: LinkOverrides;
    renderParentInstructions?: boolean;
    sdkName?: string;
};

type ProgramType = 'shank' | 'anchor';

// Account node for the parser
type ParserAccountNode = {
    name: string;
    size: number | null;
    discriminator: string | null;
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
};

const getAnchorDiscriminatorFromStateName = (accName: string) => {
    const namespace = 'account';
    const preimage = `${namespace}:${accName}`;

    const hash = crypto.createHash('sha256').update(preimage).digest();
    const discriminator = hash.subarray(0, 8); // First 8 bytes

    return Array.from(discriminator);
};

const getProgramType = (program: ProgramNode): ProgramType => {
    if (program?.origin === 'shank') {
        return 'shank';
    } else if (program?.origin === 'anchor') {
        return 'anchor';
    } else {
        throw new Error(`Unknown program type: ${program.origin}`);
    }
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
                    //TODO: handle multiple programs
                    let program = node.program;

                    // default to anchor program
                    let programType = getProgramType(program);

                    const programName = program?.name;
                    const getImportFrom = getImportFromFactory(options.linkOverrides ?? {});
                    const programAccounts = getAllAccounts(node);
                    const accounts: ParserAccountNode[] = programAccounts.map(acc => {
                        let discriminator: string | null = null;
                        if (programType === 'anchor') {
                            discriminator = `[${getAnchorDiscriminatorFromStateName(acc.name)}]`;
                        }
                        return {
                            name: acc.name,
                            size: acc.size?.valueOf() ?? null,
                            discriminator,
                        };
                    });

                    console.log('accounts', accounts);
                    const programInstructions = getAllInstructionsWithSubs(node, {
                        leavesOnly: !renderParentInstructions,
                    });

                    // Default value for  Ix discriminator - 1 Byte
                    // Shank native program uses 1 byte
                    // anchor uses 8 bytes
                    let IX_DATA_OFFSET = 1;

                    const instructions: ParserInstructionNode[] = programInstructions.map(ix => {
                        // checs for discriminator
                        let discriminator: string[] | string | null = null;
                        const discriminatorNode = ix.arguments.find(arg => arg.name === 'discriminator');
                        if (discriminatorNode) {
                            const hasDefaultValue =
                                discriminatorNode.defaultValue && isNode(discriminatorNode.defaultValue, VALUE_NODES);

                            if (hasDefaultValue) {
                                const { render: value } = renderValueNode(
                                    discriminatorNode.defaultValue,
                                    getImportFrom,
                                );

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

                        return {
                            accounts: ix.accounts.map((acc, accIdx) => {
                                return {
                                    index: accIdx,
                                    isOptional: acc.isOptional,
                                    name: acc.name,
                                };
                            }),
                            discriminator,
                            hasArgs,
                            hasOptionalAccounts,
                            name: ix.name,
                            optionalAccountStrategy: ix.optionalAccountStrategy,
                        };
                    });

                    // TODO: assuming name of codama generated sdk to be {program_name}_program_sdk for now need to change it
                    const codamaSdkName = options.sdkName
                        ? snakeCase(options.sdkName)
                        : `${snakeCase(programName)}_program_sdk`;

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
                        hasDiscriminator: instructions.every(ix => ix.discriminator !== null),
                        imports: instructionParserImports,
                        instructions,
                        programName,
                    };

                    const accCtx = {
                        accounts,
                        imports: accountParserImports,
                        programName,
                        hasDiscriminator: accounts.every(acc => acc.discriminator !== null),
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
