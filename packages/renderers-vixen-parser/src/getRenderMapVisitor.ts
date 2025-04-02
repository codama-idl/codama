import {
    AccountNode,
    getAllAccounts,
    getAllInstructionsWithSubs,
    InstructionNode,
    isNode,
    pascalCase,
    ProgramNode,
    resolveNestedTypeNode,
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

type ProgramType = 'anchor' | 'shank';

// Account node for the parser
type ParserAccountNode = {
    discriminator: string | null;
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
    name: string;
};

const getAnchorDiscriminatorFromStateName = (accName: string): string => {
    const namespace = 'account';
    const preimage = `${namespace}:${accName}`;

    const hash = crypto.createHash('sha256').update(preimage).digest();
    const discriminator = hash.subarray(0, 8); // First 8 bytes

    return JSON.stringify(Array.from(discriminator));
};

const getShankDiscriminatorFromAccountNode = (accNode: AccountNode): string | null => {
    const accData = resolveNestedTypeNode(accNode.data);
    const discField = accData.fields.find(f => f.name === 'discriminator');
    if (!discField) return null;

    const hasDefaultValue = discField.defaultValue && isNode(discField.defaultValue, VALUE_NODES);

    if (!hasDefaultValue) return null;

    const { render: value } = renderValueNode(discField.defaultValue, getImportFromFactory({}));
    return value;
};

const getIxDiscriminatorFromInstructionNode = (ixNode: InstructionNode): string | null => {
    const discField = ixNode.arguments.find(arg => arg.name === 'discriminator');
    if (!discField) return null;

    const hasDefaultValue = discField?.defaultValue && isNode(discField.defaultValue, VALUE_NODES);

    if (!hasDefaultValue) return null;

    const { render: value } = renderValueNode(discField.defaultValue, getImportFromFactory({}));
    return value;
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
                    const program = node.program;

                    // default to anchor program
                    const programType = getProgramType(program);

                    const programName = program?.name;

                    const programAccounts = getAllAccounts(node);

                    // assuming default value for Account discriminator - 1 Byte - shank
                    let accDiscLen = 1;

                    const accounts: ParserAccountNode[] = programAccounts.map(acc => {
                        let discriminator: string | null = null;
                        // anchor
                        if (programType === 'anchor') {
                            discriminator = getAnchorDiscriminatorFromStateName(pascalCase(acc.name));
                            // anchor uses 8 bytes account discriminator
                            accDiscLen = 8;
                        }
                        // shank
                        else {
                            discriminator = getShankDiscriminatorFromAccountNode(acc);
                            if (discriminator) {
                                const isDiscArray = Array.isArray(JSON.parse(discriminator) as string[]);

                                if (isDiscArray) {
                                    // set account discriminator len to the length of the array
                                    accDiscLen = Array.from(JSON.parse(discriminator) as string[]).length;
                                }

                                if (accDiscLen == 1) {
                                    discriminator = `[${discriminator}]`;
                                }
                            }
                        }
                        return {
                            discriminator,
                            name: acc.name,
                            size: acc.size?.valueOf() ?? null,
                        };
                    });

                    const programInstructions = getAllInstructionsWithSubs(node, {
                        leavesOnly: !renderParentInstructions,
                    });

                    // assuming default value for Instruction discriminator - 1 Byte - shank
                    let ixDiscLen = 1;

                    const instructions: ParserInstructionNode[] = programInstructions.map(ix => {
                        let discriminator = getIxDiscriminatorFromInstructionNode(ix);

                        if (discriminator) {
                            const isDiscArray = Array.isArray(JSON.parse(discriminator) as string[]);
                            if (isDiscArray) {
                                // set instruction discriminator len to the length of the array
                                ixDiscLen = Array.from(JSON.parse(discriminator) as string[]).length;
                            }

                            if (ixDiscLen == 1) {
                                discriminator = `[${discriminator}]`;
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
                        accounts,
                        hasDiscriminator: instructions.some(ix => ix.discriminator !== null),
                        imports: instructionParserImports,
                        instructions,
                        ixDiscLen,
                        programName,
                    };

                    const accCtx = {
                        accDiscLen,
                        accounts,
                        hasDiscriminator: accounts.some(acc => acc.discriminator !== null),
                        imports: accountParserImports,
                        programName,
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
