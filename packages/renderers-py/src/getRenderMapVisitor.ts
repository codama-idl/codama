import { join } from 'node:path';

//import { logWarn } from '@codama/errors';
import {
    camelCase, getAllAccounts, getAllPdas, getAllInstructions,
    getAllDefinedTypes,
    getAllPrograms, resolveNestedTypeNode
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

import { getDiscriminatorConstantsFragment, getFieldsJSON, getFieldsPy, getArgsToPy, getFieldsDecode,getFieldsToJSON, getLayoutFields, getArgsToLayout, getFieldsFromJSON } from './fragments';
import { getTypeManifestVisitor, TypeManifestVisitor } from './getTypeManifestVisitor';
import {
    getImportFromFactory,
    //GetImportFromFunction,
    LinkOverrides,
    //ParsedCustomDataOptions,
    render as baseRender,
} from './utils';

import { ImportMap } from './ImportMap';


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
//export type GlobalFragmentScope = {};

export function getRenderMapVisitor(options: GetRenderMapOptions = {}) {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();

    const getImportFrom = getImportFromFactory(options.linkOverrides ?? {});
    const dependencyMap = options.dependencyMap ?? {};
    const useGranularImports = options.useGranularImports ?? false;


    const parentName: string | null = null;

    //const getTraitsFromNode = getTraitsFromNodeFactory(options.traitOptions);
    const typeManifestVisitor = getTypeManifestVisitor({ getImportFrom, linkables, parentName, stack });
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

                    let fields = resolveNestedTypeNode(node.data).fields;
                    //fields.shift();
                    const fieldsJSON = getFieldsJSON({
                        ...scope,
                        fields
                    });
                    const fieldsPy = getFieldsPy({
                        ...scope,
                        fields
                    });
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
                        fields
                    });
                    const fieldsDecode = getFieldsDecode({
                        ...scope,
                        fields
                    });

                    const fieldsFromJSON = getFieldsFromJSON({
                        ...scope,
                        fields
                    });

                    const imports = new ImportMap().add("solders.pubkey", "Pubkey");
                    imports.add("solana.rpc.async_api", "AsyncClient");
                    imports.add("solana.rpc.commitment", "Commitment");
                    imports.add("dataclasses", "dataclass");
                    imports.add("solana.rpc.types", "MemcmpOpts")
                    imports.add("anchorpy.borsh_extension", "BorshPubkey");
                    imports.add("anchorpy.coder.accounts", "ACCOUNT_DISCRIMINATOR_SIZE");
                    imports.addAlias("", "borsh_construct", "borsh");
                    imports.add("", "typing");
                    imports.add("anchorpy.utils.rpc", "get_multiple_accounts");
                    imports.add("", "borsh_construct");
                    imports.add("..program_id", "PROGRAM_ID");
                    imports.add("anchorpy.error", "AccountInvalidDiscriminator");
                    imports.mergeWith(fieldsJSON!);
                    imports.mergeWith(fieldsPy!);
                    imports.mergeWith(layoutFragment!);
                    imports.mergeWith(fieldsToJSON!);
                    imports.mergeWith(fieldsFromJSON!);

                    //console.log("fieldsToJSON:", fieldsToJSON, accountDiscriminatorConstantsFragment);
                    let filename = `${camelCase(node.name)}`
                    if (filename == "global") {
                        filename = "global_";
                    }
                    return new RenderMap().add(
                        `accounts/${filename}.py`,
                        render('accountsPage.njk', {
                            accountName: node.name,
                            discriminator_assignment: accountDiscriminatorConstantsFragment,
                            fields: fields,
                            fieldsJSON_assignment: fieldsJSON,
                            fields_interface_params: fieldsPy,
                            fieldsLayout: layoutFragment,
                            fieldsDecode: fieldsDecode,
                            fieldsToJSON: fieldsToJSON,
                            fieldsFromJSON: fieldsFromJSON,
                            typeManifest: typeManifest,
                            imports: imports.toString(dependencyMap, useGranularImports),
                        }),
                    );
                },

                visitDefinedType(node) {
                    //const typeManifest = visit(node, typeManifestVisitor);
                    //console.log('typeManifest:', typeManifest);
                    const scope = {
                        ...globalScope,
                        typeManifest: visit(node, typeManifestVisitor),
                    };
                    const imports = new ImportMap().add("solders.pubkey", "Pubkey");
                    imports.add("solders.sysvar", "RENT");
                    imports.add("construct", "Container");
                    imports.addAlias("", "borsh_construct", "borsh");
                    imports.add("", "borsh_construct");
                    imports.add("", "typing");
                    imports.add("dataclasses", "dataclass");
                    imports.add("anchorpy.borsh_extension", "BorshPubkey");



                    let nodeType = node.type; //resolveNestedTypeNode(node.data).fields;
                    //console.log("fields",fields);
                    //console.log("visitDefinedType:", node);
                    if (nodeType.kind == "structTypeNode") {
                        let fields = nodeType.fields;
                        const layoutFragment = getLayoutFields({
                            ...scope,
                            fields,
                            prefix: node.name,
                        });

                        const fieldsJSON = getFieldsJSON({
                            ...scope,
                            fields
                        });
                        const fieldsPy = getFieldsPy({
                            ...scope,
                            fields
                        });
                        const fieldsToJSON = getFieldsToJSON({
                            ...scope,
                            fields
                        });
                        const fieldsFromJSON = getFieldsFromJSON({
                            ...scope,
                            fields
                        });
                        //console.log("visitDefinedType:", node);
                        //if (node.name == "AmmCurve2"){
                        //    return new RenderMap().add(`types/${camelCase(node.name)}.py`, render('definedTypesPage.njk',{



                        return new RenderMap().add(`types/${camelCase(node.name)}.py`, render('definedTypesPage.njk', {
                            typeName: node.name,
                            fields: fields,
                            fieldsJSON_assignment: fieldsJSON,
                            fields_interface_params: fieldsPy,
                            fieldsLayout: layoutFragment,
                            fieldsToJSON: fieldsToJSON,
                            fieldsFromJSON: fieldsFromJSON,
                            imports: imports.toString(dependencyMap, useGranularImports),
                            discriminator: "",

                        }));
                    } else {
                        //let variants = nodeType as enumTypeNode;
                        if (nodeType.kind == "enumTypeNode") {
                            let variants = nodeType.variants;
                            imports.add("anchorpy.borsh_extension", "EnumForCodegen");
                            console.log("variant:",variants[1]);
                            return new RenderMap().add(`types/${camelCase(node.name)}.py`, render('definedEnumTypesPage.njk', {
                                typeName: node.name,
                                variants: variants,
                                imports: imports.toString(dependencyMap, useGranularImports),

                            }));
                        }
                        return new RenderMap().add(`types/${camelCase(node.name)}.py`, render('definedEnumTypesPage.njk', {
                            typeName: node.name,
                            imports: imports.toString(dependencyMap, useGranularImports),
                        }));
                    }

                },

                visitInstruction(node) {
                    const scope = {
                        ...globalScope,
                        typeManifest: visit(node, typeManifestVisitor),
                    };

                    let fields = node.arguments;
                    const layoutFragment = getLayoutFields({
                        ...scope,
                        fields,
                        prefix: node.name,
                    });
                    const argsToPy = getArgsToPy({
                        ...scope,
                        fields
                    })
                    let argsToLayout = getArgsToLayout({
                        ...scope,
                        fields
                    })
                    const imports = new ImportMap().add("solders.pubkey", "Pubkey");
                    ;
                    imports.add("solders.instruction", ["Instruction", "AccountMeta"]);
                    //imports.add("anchorpy.borsh_extension", "BorshPubkey");
                    imports.add("", "typing");
                    imports.add("..program_id", "PROGRAM_ID");
                    imports.add("solders.sysvar", "RENT");
                    imports.add("construct", "Container");
                    imports.addAlias("", "borsh_construct", "borsh");
                    imports.add("", "borsh_construct");
                    imports.add("dataclasses", "dataclass");
                    imports.mergeWith(argsToLayout!);
                    imports.mergeWith(layoutFragment!);
                    imports.mergeWith(argsToPy!);




                    const discriminatorConstantsFragment = getDiscriminatorConstantsFragment({
                        ...scope,
                        discriminatorNodes: node.discriminators ?? [],
                        fields,
                        prefix: node.name,
                    });



                    return new RenderMap().add(
                        `instructions/${camelCase(node.name)}.py`,
                        render('instructionsPage.njk', {
                            instructionName: node.name,
                            args: argsToPy,
                            accounts: node.accounts,
                            fieldsLayout: layoutFragment,
                            argsToLayout: argsToLayout,
                            discriminator: discriminatorConstantsFragment,
                            imports: imports.toString(dependencyMap, useGranularImports),
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
                    const imports = new ImportMap().add("solders.pubkey", "Pubkey");

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

                    const instructionsToExport = getAllInstructions(node);//filter(isNotInternal);
                    const definedTypesToExport = getAllDefinedTypes(node);

                    const hasAnythingToExport = programsToExport.length > 0 || accountsToExport.length > 0;

                    const ctx = {
                        accountsToExport,
                        //definedTypesToExport,
                        hasAnythingToExport,
                        //instructionsToExport,
                        pdasToExport,
                        programsToExport,
                        programsWithErrorsToExport,
                        definedTypesToExport,
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
