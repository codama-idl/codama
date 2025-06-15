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
import { snakeCase } from '@codama/nodes';
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
import { GeneratedType, getTypeManifestVisitor, TypeManifestVisitor } from './getTypeManifestVisitor';
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
    genType: GeneratedType;
    typeManifestVisitor: TypeManifestVisitor;
};
export function getInstructionPDAs(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        accounts: InstructionAccountNode[];
        argv: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): InstructionAccountNode[] {
    const { accounts } = scope;

    const pdas = accounts
        .map(acc => {
            if (acc.defaultValue) {
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

    const genType = new GeneratedType('', '');

    //const getTraitsFromNode = getTraitsFromNodeFactory(options.traitOptions);
    const typeManifestVisitor = getTypeManifestVisitor({ genType, getImportFrom, linkables, stack });
    const globalScope: GlobalFragmentScope = {
        genType: genType,
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
                    const program = findProgramNodeFromPath(accountPath);
                    if (!program) {
                        throw new Error('Account must be visited inside a program.');
                    }

                    const typeManifest = visit(node, typeManifestVisitor);
                    const scope = {
                        ...globalScope,
                        accountPath,
                        typeManifest: visit(node, typeManifestVisitor),
                    };

                    const fields = resolveNestedTypeNode(node.data).fields;
                    const accountFieldsJSON = getFieldsJSON({
                        ...scope,
                        fields,
                    });
                    const accountFieldsPy = getFieldsPy({
                        ...scope,
                        fields,
                    });

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
                    const fieldsToEncodable = getFieldsToJSONEncodable({
                        ...scope,
                        fields,
                    });

                    const imports = new ImportMap();
                    imports.add('solders.pubkey', 'Pubkey');
                    imports.addAlias('solders.pubkey', 'Pubkey', 'SolPubkey');
                    imports.add('solana.rpc.async_api', 'AsyncClient');
                    imports.add('solana.rpc.commitment', 'Commitment');
                    imports.add('dataclasses', 'dataclass');
                    imports.addAlias('', 'borsh_construct', 'borsh');
                    imports.add('', 'typing');
                    imports.add('anchorpy.utils.rpc', 'get_multiple_accounts');
                    imports.add('', 'borsh_construct');
                    imports.add('..program_id', snakeCase(program?.name).toUpperCase() + '_PROGRAM_ADDRESS');
                    imports.add('anchorpy.error', 'AccountInvalidDiscriminator');
                    imports.mergeWith(accountFieldsJSON!);
                    imports.mergeWith(accountFieldsPy!);
                    imports.mergeWith(layoutFragment);
                    imports.mergeWith(fieldsToJSON!);
                    imports.mergeWith(fieldsFromJSON!);

                    //console.log("fieldsToJSON:", fieldsToJSON, accountDiscriminatorConstantsFragment);
                    let accountFilename = `${camelCase(node.name)}`;
                    if (accountFilename == 'global') {
                        accountFilename = 'global_';
                    }
                    return new RenderMap().add(
                        `accounts/${accountFilename}.py`,
                        render('accountsPage.njk', {
                            accountName: node.name,
                            discriminator_assignment: accountDiscriminatorConstantsFragment,
                            fields: fields,
                            fieldsDecode: fieldsDecode,
                            fieldsFromJSON: fieldsFromJSON,
                            fieldsJSON_assignment: accountFieldsJSON,
                            fieldsLayout: layoutFragment,
                            fieldsToEncodable: fieldsToEncodable,
                            fieldsToJSON: fieldsToJSON,
                            fields_interface_params: accountFieldsPy,
                            imports: imports.toString(dependencyMap, useGranularImports),
                            program: program,
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
                    const imports = new ImportMap();

                    imports.addAlias('', 'borsh_construct', 'borsh');
                    imports.add('', 'borsh_construct');
                    imports.add('', 'typing');
                    imports.add('dataclasses', 'dataclass');

                    const nodeType = node.type; //resolveNestedTypeNode(node.data).fields;
                    if (nodeType.kind == 'structTypeNode') {
                        imports.add('construct', 'Container');
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
                            render('definedStructTypesPage.njk', {
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
                    } else if (nodeType.kind == 'enumTypeNode') {
                        const variants = nodeType.variants;

                        if (nodeType.size.kind == 'numberTypeNode') {
                            if (nodeType.size.format == 'u32') {
                                imports.add('..shared', 'EnumForCodegenU32');
                            } else if (nodeType.size.format == 'u16') {
                                imports.add('..shared', 'EnumForCodegenU16');
                            } else {
                                imports.add('anchorpy.borsh_extension', 'EnumForCodegen');
                            }
                        }
                        const helper = new EnumHelper(variants, scope);
                        const herlperImports = helper.genAllImports();
                        imports.mergeWith(herlperImports);

                        return new RenderMap().add(
                            `types/${camelCase(node.name)}.py`,
                            render('definedEnumTypesPage.njk', {
                                enumHelper: helper,
                                imports: imports.toString(dependencyMap, useGranularImports),
                                size: nodeType.size,
                                typeName: node.name,
                                variants: variants,
                            }),
                        );
                    } else {
                        //throw new Error(`DefinedType not supported by ${node.type.kind}`);
                        const inner = visit(nodeType, typeManifestVisitor);
                        imports.mergeWith(inner.borshType);
                        //console.log('DefinedType ', inner);
                        return new RenderMap().add(
                            `types/${camelCase(node.name)}.py`,
                            render('definedTypesPage.njk', {
                                borshType: inner.borshType,
                                imports,
                                pyType: inner.pyType,
                                typeName: node.name,
                            }),
                        );
                    }
                },

                visitInstruction(node) {
                    genType.name = 'instructions';
                    const instructionPath = stack.getPath('instructionNode');
                    const program = findProgramNodeFromPath(instructionPath);
                    if (!program) {
                        throw new Error('Account must be visited inside a program.');
                    }
                    const scope = {
                        ...globalScope,
                        genType,
                        typeManifest: visit(node, typeManifestVisitor),
                    };

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
                    const imports = new ImportMap();
                    imports.add('solders.pubkey', 'Pubkey');
                    imports.addAlias('solders.pubkey', 'Pubkey', 'SolPubkey');
                    imports.add('solders.instruction', ['Instruction', 'AccountMeta']);
                    imports.add('', 'typing');
                    //imports.add('..program_id', 'PROGRAM_ID');
                    imports.add('..program_id', snakeCase(program?.name).toUpperCase() + '_PROGRAM_ADDRESS');
                    if (argsToLayout) {
                        if (argsToLayout.renders.length > 0) {
                            imports.addAlias('', 'borsh_construct', 'borsh');
                            imports.add('', 'borsh_construct');
                        }
                    }
                    imports.mergeWith(argsToLayout!);
                    imports.mergeWith(layoutFragment);
                    imports.mergeWith(argsToPy!);

                    const discriminatorConstantsFragment = getDiscriminatorConstantsFragment({
                        ...scope,
                        discriminatorNodes: node.discriminators ?? [],
                        fields,
                        prefix: node.name,
                    });
                    const pdas = getInstructionPDAs({
                        ...scope,
                        accounts: node.accounts,
                        argv: fields,
                    });
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
                            program: program,
                        }),
                    );
                },
                /*
                visitPda(node) {
                    const pdaPath = stack.getPath('pdaNode');
                    if (!findProgramNodeFromPath(pdaPath)) {
                        throw new Error('Account must be visited inside a program.');
                    }

                    return new RenderMap().add(`pdas/${camelCase(node.name)}.ts`, render('pdasPage.njk', {}));
                    },*/

                visitProgram(node, { self }) {
                    //const scope = { ...globalScope, programNode: node };
                    //const imports = new ImportMap().add('solders.pubkey', 'Pubkey');

                    const renderMap = new RenderMap()
                        .mergeWith(...node.pdas.map(p => visit(p, self)))
                        .mergeWith(...node.accounts.map(a => visit(a, self)))
                        .mergeWith(...node.definedTypes.map(t => visit(t, self)))
                        .mergeWith(...node.instructions.map(t => visit(t, self)));

                    if (node.errors.length > 0) {
                        renderMap.add(
                            'errors/__init__.py',
                            render('errorsIndex.njk', {
                                nodeName: node.name,
                            }),
                        );

                        const errimports = new ImportMap();
                        errimports.add('anchorpy.error', 'ProgramError');
                        errimports.add('', 'typing');
                        renderMap.add(
                            `errors/${camelCase(node.name)}.py`,
                            render('errorsPage.njk', {
                                errors: node.errors,
                                imports: errimports.toString(dependencyMap, useGranularImports),
                            }),
                        );
                    }
                    /*
                    renderMap.add(
                        `program_id.py`,
                        render('programsPage.njk', {
                            ...scope,
                            imports: imports.toString(dependencyMap, useGranularImports),
                        }),
                        );*/
                    return renderMap;
                },

                visitRoot(node, { self }) {
                    //const isNotInternal = (n: { name: CamelCaseString }) => !internalNodes.includes(n.name);
                    const programsToExport = getAllPrograms(node);
                    genType.origin = node.program.origin;
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

                    map.add('shared/__init__.py', render('sharedIndex.njk', ctx));
                    map.add('shared/extension.py', render('extension.py', ctx));
                    {
                        const imports = new ImportMap().add('solders.pubkey', 'Pubkey');
                        map.add(
                            `program_id.py`,
                            render('programsPage.njk', {
                                imports: imports.toString(dependencyMap, useGranularImports),
                                programs: programsToExport,
                            }),
                        );
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
