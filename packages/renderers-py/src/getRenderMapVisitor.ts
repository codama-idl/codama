import { join } from 'node:path';

//import { logWarn } from '@codama/errors';
import {
    camelCase,
    getAllAccounts,
    getAllDefinedTypes,
    getAllInstructions,
    getAllPdas,
    getAllPrograms,
    InstructionAccountNode,
    InstructionArgumentNode,
    resolveNestedTypeNode,
    StructFieldTypeNode,
} from '@codama/nodes';
import { RenderMap } from '@codama/renderers-core';
import {
    extendVisitor,
    findProgramNodeFromPath,
    LinkableDictionary,
    NodeStack,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    recordNodeStackVisitor,
    staticVisitor,
    visit,
} from '@codama/visitors-core';
import type { ConfigureOptions } from 'nunjucks';

import { EnumHelper } from './enumHelper';
import {
    getArgsToLayout,
    getArgsToPy,
    getDiscriminatorConstantsFragment,
    getFieldsDecode,
    getFieldsFromDecode,
    getFieldsFromJSON,
    getFieldsJSON,
    getFieldsPy,
    getFieldsToJSON,
    getFieldsToJSONEncodable,
    getLayoutFields,
} from './fragments';
import { GenType, getTypeManifestVisitor, TypeManifestVisitor } from './getTypeManifestVisitor';
import { ImportMap } from './ImportMap';
import {
    getImportFromFactory,
    //GetImportFromFunction,
    LinkOverrides,
    //ParsedCustomDataOptions,
    render as baseRender,
} from './utils';

export type GetRenderMapOptions = {
    dependencyMap?: Record<string, string>;
    linkOverrides?: LinkOverrides;
    nonScalarEnums?: string[];
    renderParentInstructions?: boolean;
    useGranularImports?: boolean;
};

export type GlobalFragmentScope = {
    typeManifestVisitor: TypeManifestVisitor;
};
export function getInstructionPdas(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        accounts: InstructionAccountNode[];
        argv: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): InstructionAccountNode[] {
    const { accounts } = scope;

    const pdas = accounts
        .map(acc => {
            if (acc.defaultValue) {
                //acc.defaultValue
                return acc; //acc.defaultValue
            }
            return null;
        })
        .filter(it => it != null);
    return pdas;
}

export function getRenderMapVisitor(options: GetRenderMapOptions = {}) {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();

    const getImportFrom = getImportFromFactory(options.linkOverrides ?? {});
    const dependencyMap = options.dependencyMap ?? {};
    const useGranularImports = options.useGranularImports ?? false;

    const genType = new GenType('');

    //const getTraitsFromNode = getTraitsFromNodeFactory(options.traitOptions);
    const typeManifestVisitor = getTypeManifestVisitor({ genType, getImportFrom, linkables, stack });
    const globalScope: GlobalFragmentScope = {
        typeManifestVisitor: typeManifestVisitor,
    };
    const render = (template: string, context?: object, renderOptions?: ConfigureOptions): string => {
        return baseRender(join('pages', template), context, renderOptions);
    };

    return pipe(
        staticVisitor(() => new RenderMap(), {
            keys: ['rootNode', 'programNode', 'pdaNode', 'accountNode', 'definedTypeNode', 'instructionNode'],
        }),
        v =>
            extendVisitor(v, {
                visitAccount(node) {
                    const accountPath = stack.getPath('accountNode');
                    genType.name = 'accounts';
                    if (!findProgramNodeFromPath(accountPath)) {
                        throw new Error('Account must be visited inside a program.');
                    }

                    const typeManifest = visit(node, typeManifestVisitor);
                    //console.log('typeManifest:', typeManifest);
                    const scope = {
                        ...globalScope,
                        accountPath,
                        typeManifest: visit(node, typeManifestVisitor),
                    };

                    const fields = resolveNestedTypeNode(node.data).fields;
                    //fields.shift();
                    const fieldsJSON = getFieldsJSON({
                        ...scope,
                        fields,
                    });
                    const fieldsPy = getFieldsPy({
                        ...scope,
                        fields,
                    });
                    //bin const pda = node.pda ? linkables.get([...stack.getPath(), node.pda]) : undefined;
                    //const pdaSeeds = pda?.seeds ?? [];
                    //console.log("pdaSeeds",pdaSeeds);
                    //console.log("discriminatorNodes: node.discriminators:", node.discriminators)

                    const accountDiscriminatorConstantsFragment = getDiscriminatorConstantsFragment({
                        ...scope,
                        discriminatorNodes: node.discriminators ?? [],
                        fields,
                        prefix: node.name,
                    });
                    const layoutFragment = getLayoutFields({
                        ...scope,
                        fields,
                        prefix: node.name,
                    });
                    const fieldsToJSON = getFieldsToJSON({
                        ...scope,
                        fields,
                    });
                    const fieldsDecode = getFieldsDecode({
                        ...scope,
                        fields,
                    });

                    const fieldsFromJSON = getFieldsFromJSON({
                        ...scope,
                        fields,
                    });

                    const imports = new ImportMap().add('solders.pubkey', 'Pubkey');
                    imports.add('solana.rpc.async_api', 'AsyncClient');
                    imports.add('solana.rpc.commitment', 'Commitment');
                    imports.add('dataclasses', 'dataclass');
                    imports.add('solana.rpc.types', 'MemcmpOpts');
                    imports.add('anchorpy.borsh_extension', 'BorshPubkey');
                    imports.add('anchorpy.coder.accounts', 'ACCOUNT_DISCRIMINATOR_SIZE');
                    imports.addAlias('', 'borsh_construct', 'borsh');
                    imports.add('', 'typing');
                    imports.add('anchorpy.utils.rpc', 'get_multiple_accounts');
                    imports.add('', 'borsh_construct');
                    imports.add('..program_id', 'PROGRAM_ID');
                    imports.add('anchorpy.error', 'AccountInvalidDiscriminator');
                    imports.mergeWith(fieldsJSON!);
                    imports.mergeWith(fieldsPy!);
                    imports.mergeWith(layoutFragment);
                    imports.mergeWith(fieldsToJSON!);
                    imports.mergeWith(fieldsFromJSON!);

                    //console.log("fieldsToJSON:", fieldsToJSON, accountDiscriminatorConstantsFragment);
                    let filename = `${camelCase(node.name)}`;
                    if (filename == 'global') {
                        filename = 'global_';
                    }
                    return new RenderMap().add(
                        `accounts/${filename}.py`,
                        render('accountsPage.njk', {
                            accountName: node.name,
                            discriminator_assignment: accountDiscriminatorConstantsFragment,
                            fields: fields,
                            fieldsDecode: fieldsDecode,
                            fieldsFromJSON: fieldsFromJSON,
                            fieldsJSON_assignment: fieldsJSON,
                            fieldsLayout: layoutFragment,
                            fieldsToJSON: fieldsToJSON,
                            fields_interface_params: fieldsPy,
                            imports: imports.toString(dependencyMap, useGranularImports),
                            typeManifest: typeManifest,
                        }),
                    );
                },

                visitDefinedType(node) {
                    const scope = {
                        ...globalScope,
                        typeManifest: visit(node, typeManifestVisitor),
                    };
                    genType.name = 'types';
                    const imports = new ImportMap().add('solders.pubkey', 'Pubkey');
                    imports.add('solders.sysvar', 'RENT');
                    imports.add('construct', 'Container');
                    imports.addAlias('', 'borsh_construct', 'borsh');
                    imports.add('', 'borsh_construct');
                    imports.add('', 'typing');
                    imports.add('dataclasses', 'dataclass');
                    imports.add('anchorpy.borsh_extension', 'BorshPubkey');

                    const nodeType = node.type; //resolveNestedTypeNode(node.data).fields;
                    if (nodeType.kind == 'structTypeNode') {
                        const fields = nodeType.fields;
                        const layoutFragment = getLayoutFields({
                            ...scope,
                            fields,
                            prefix: node.name,
                        });

                        const fieldsJSON = getFieldsJSON({
                            ...scope,
                            fields,
                        });
                        const fieldsPy = getFieldsPy({
                            ...scope,
                            fields,
                        });
                        const fieldsToJSON = getFieldsToJSON({
                            ...scope,
                            fields,
                        });
                        const fieldsFromJSON = getFieldsFromJSON({
                            ...scope,
                            fields,
                        });
                        const fieldsFromDecode = getFieldsFromDecode({
                            ...scope,
                            fields,
                        });
                        const fieldsToEncodable = getFieldsToJSONEncodable({
                            ...scope,
                            fields,
                        });
                        imports.mergeWith(layoutFragment);
                        imports.mergeWith(fieldsJSON!);
                        imports.mergeWith(fieldsPy!);
                        imports.mergeWith(fieldsToJSON!);

                        return new RenderMap().add(
                            `types/${camelCase(node.name)}.py`,
                            render('definedTypesPage.njk', {
                                discriminator: '',
                                fields: fields,
                                fieldsFromDecode: fieldsFromDecode,
                                fieldsFromJSON: fieldsFromJSON,
                                fieldsJSON_assignment: fieldsJSON,
                                fieldsLayout: layoutFragment,
                                fieldsToEncodable: fieldsToEncodable,
                                fieldsToJSON: fieldsToJSON,
                                fields_interface_params: fieldsPy,
                                imports: imports.toString(dependencyMap, useGranularImports),
                                typeName: node.name,
                            }),
                        );
                    } else {
                        //let variants = nodeType as enumTypeNode;
                        if (nodeType.kind == 'enumTypeNode') {
                            const variants = nodeType.variants;
                            imports.add('anchorpy.borsh_extension', 'EnumForCodegen');
                            console.log('variant:', variants[1]);
                            const helper = new EnumHelper(variants, scope);
                            const herlperImports = helper.genAllImports();
                            imports.mergeWith(herlperImports);

                            return new RenderMap().add(
                                `types/${camelCase(node.name)}.py`,
                                render('definedEnumTypesPage.njk', {
                                    enumHelper: helper,
                                    imports: imports.toString(dependencyMap, useGranularImports),
                                    typeName: node.name,
                                    variants: variants,
                                }),
                            );
                        }
                        return new RenderMap().add(
                            `types/${camelCase(node.name)}.py`,
                            render('definedEnumTypesPage.njk', {
                                imports: imports.toString(dependencyMap, useGranularImports),
                                typeName: node.name,
                            }),
                        );
                    }
                },

                visitInstruction(node) {
                    const scope = {
                        ...globalScope,
                        typeManifest: visit(node, typeManifestVisitor),
                    };
                    genType.name = 'instructions';

                    const fields = node.arguments;
                    const layoutFragment = getLayoutFields({
                        ...scope,
                        fields,
                        prefix: node.name,
                    });
                    const argsToPy = getArgsToPy({
                        ...scope,
                        fields,
                    });
                    const argsToLayout = getArgsToLayout({
                        ...scope,
                        fields,
                    });
                    const imports = new ImportMap().add('solders.pubkey', 'Pubkey');
                    imports.add('solders.instruction', ['Instruction', 'AccountMeta']);
                    //imports.add("anchorpy.borsh_extension", "BorshPubkey");
                    imports.add('', 'typing');
                    imports.add('..program_id', 'PROGRAM_ID');
                    imports.add('solders.sysvar', 'RENT');
                    imports.add('construct', 'Container');
                    imports.addAlias('', 'borsh_construct', 'borsh');
                    imports.add('', 'borsh_construct');
                    imports.add('dataclasses', 'dataclass');
                    imports.mergeWith(argsToLayout!);
                    imports.mergeWith(layoutFragment);
                    imports.mergeWith(argsToPy!);

                    const discriminatorConstantsFragment = getDiscriminatorConstantsFragment({
                        ...scope,
                        discriminatorNodes: node.discriminators ?? [],
                        fields,
                        prefix: node.name,
                    });
                    const pdas = getInstructionPdas({
                        ...scope,
                        accounts: node.accounts,
                        argv: fields,
                    });
                    //console.log('pdas', node.name, pdas);
                    return new RenderMap().add(
                        `instructions/${camelCase(node.name)}.py`,
                        render('instructionsPage.njk', {
                            accounts: node.accounts,
                            args: argsToPy,
                            argsToLayout: argsToLayout,
                            discriminator: discriminatorConstantsFragment,
                            fieldsLayout: layoutFragment,
                            imports: imports.toString(dependencyMap, useGranularImports),
                            instructionName: node.name,
                            pdas: pdas,
                        }),
                    );
                },

                visitPda(node) {
                    const pdaPath = stack.getPath('pdaNode');
                    if (!findProgramNodeFromPath(pdaPath)) {
                        throw new Error('Account must be visited inside a program.');
                    }

                    return new RenderMap().add(`pdas/${camelCase(node.name)}.ts`, render('pdasPage.njk', {}));
                },

                visitProgram(node, { self }) {
                    const scope = { ...globalScope, programNode: node };
                    const imports = new ImportMap().add('solders.pubkey', 'Pubkey');

                    const renderMap = new RenderMap()
                        .mergeWith(...node.pdas.map(p => visit(p, self)))
                        .mergeWith(...node.accounts.map(a => visit(a, self)))
                        .mergeWith(...node.definedTypes.map(t => visit(t, self)))
                        .mergeWith(...node.instructions.map(t => visit(t, self)));

                    renderMap.add(
                        `program_id.py`,
                        render('programsPage.njk', {
                            ...scope,
                            imports: imports.toString(dependencyMap, useGranularImports),
                        }),
                    );
                    return renderMap;
                },

                visitRoot(node, { self }) {
                    //const isNotInternal = (n: { name: CamelCaseString }) => !internalNodes.includes(n.name);
                    const programsToExport = getAllPrograms(node);
                    const programsWithErrorsToExport = programsToExport.filter(p => p.errors.length > 0);
                    const pdasToExport = getAllPdas(node);
                    const accountsToExport = getAllAccounts(node); //.filter(isNotInternal);

                    const instructionsToExport = getAllInstructions(node); //filter(isNotInternal);
                    const definedTypesToExport = getAllDefinedTypes(node);

                    const hasAnythingToExport = programsToExport.length > 0 || accountsToExport.length > 0;

                    const ctx = {
                        accountsToExport,

                        definedTypesToExport,

                        //definedTypesToExport,
                        hasAnythingToExport,
                        //instructionsToExport,
                        pdasToExport,
                        programsToExport,
                        programsWithErrorsToExport,
                        root: node,
                    };

                    const map = new RenderMap();
                    if (pdasToExport.length > 0) {
                        map.add('pdas/index.py', render('pdasIndex.njk', ctx));
                    }
                    if (accountsToExport.length > 0) {
                        map.add('accounts/__init__.py', render('accountsIndex.njk', ctx));
                    }
                    if (instructionsToExport.length > 0) {
                        map.add('instructions/__init__.py', render('instructionsIndex.njk', ctx));
                    }
                    if (definedTypesToExport.length > 0) {
                        map.add('types/__init__.py', render('definedTypesIndex.njk', ctx));
                    }

                    return map
                        .add('__init__.py', render('rootIndex.njk', ctx))
                        .mergeWith(...getAllPrograms(node).map(p => visit(p, self)));
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
