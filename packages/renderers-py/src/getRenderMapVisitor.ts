import { join } from 'node:path';

//import { logWarn } from '@codama/errors';
import { camelCase, getAllAccounts, getAllPdas, getAllPrograms, resolveNestedTypeNode } from '@codama/nodes';
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

import { getDiscriminatorConstantsFragment, getFieldsJSON,getFieldsPy,getFieldsToJSON,getLayoutFields,getFieldsFromJSON } from './fragments';
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
                    console.log('typeManifest:', typeManifest);
                    const scope = {
                        ...globalScope,
                        accountPath,
                        typeManifest: visit(node, typeManifestVisitor),
                    };

                    let fields = resolveNestedTypeNode(node.data).fields;
                    //fields.shift();
                    const fieldsJSON= getFieldsJSON({
                        ...scope,
                        fields});
                    const fieldsPy= getFieldsPy({
                        ...scope,
                        fields});
                    console.log("discriminatorNodes: node.discriminators:",node.discriminators )

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
                    const fieldsFromJSON = getFieldsFromJSON({
                        ...scope,
                        fields
                    });

                    const imports = new ImportMap().add("solana.publickey","Pubkey");
                    imports.add("solana.rpc.api","Client");
                    imports.add("solana.rpc.types","MemcmpOpts")
                    imports.add("anchorpy.borsh_extension","BorshPubkey");
                    imports.add("anchorpy.coder.accounts","ACCOUNT_DISCRIMINATOR_SIZE");
                    imports.addAlias("","borsh_construct","borsh");
                    imports.add("","typing");
                    imports.add("..program_id","PROGRAM_ID");

                    console.log("fieldsToJSON:",fieldsToJSON,accountDiscriminatorConstantsFragment);

                    return new RenderMap().add(
                        `accounts/${camelCase(node.name)}.py`,
                        render('accountsPage.njk', {
                            accountName: node.name,
                            discriminator_assignment: accountDiscriminatorConstantsFragment,
                            fields: fields,
                            fieldsJSON_assignment: fieldsJSON,
                            fields_interface_params: fieldsPy,
                            fieldsLayout: layoutFragment,
                            fieldsToJSON: fieldsToJSON,
                            fieldsFromJSON:fieldsFromJSON,
                            typeManifest: typeManifest,
                            imports: imports.toString(dependencyMap, useGranularImports),
                        }),
                    );
                },

                visitDefinedType(node) {
                    const typeManifest = visit(node, typeManifestVisitor);
                    console.log('typeManifest:', typeManifest);
                    const scope = {
                        ...globalScope,
                        typeManifest: visit(node, typeManifestVisitor),
                    };

                    let  nodeType = node.type; //resolveNestedTypeNode(node.data).fields;
                    //console.log("fields",fields);
                    if (nodeType.kind == "structTypeNode"){
                        let fields = nodeType.fields;
                        const layoutFragment = getLayoutFields({
                        ...scope,
                        fields,
                        prefix: node.name,
                    });

                     const fieldsJSON= getFieldsJSON({
                        ...scope,
                        fields});
                    const fieldsPy= getFieldsPy({
                        ...scope,
                        fields});

                    return new RenderMap().add(`types/${camelCase(node.name)}.py`, render('definedTypesPage.njk', {
                        typeName: node.name,
                    fields: fields,
                            fieldsJSON_assignment: fieldsJSON,
                            fields_interface_params: fieldsPy,
                            fieldsLayout: layoutFragment,
                            }));

                    }
                    return new RenderMap().add(`types/${camelCase(node.name)}.py`, render('definedTypesPage.njk', {}));

                                   },

                visitInstruction(node) {
                    /* const instructionPath = stack.getPath('instructionNode');
                if (!findProgramNodeFromPath(instructionPath)) {
                    throw new Error('Instruction must be visited inside a program.');
                }

                const instructionExtraName = nameApi.instructionExtraType(node.name);
                const scope = {
                    ...globalScope,
                    dataArgsManifest: visit(node, typeManifestVisitor),
                    extraArgsManifest: visit(
                        definedTypeNode({
                            name: instructionExtraName,
                            type: structTypeNodeFromInstructionArgumentNodes(node.extraArguments ?? []),
                        }),
                        typeManifestVisitor,
                    ),
                    instructionPath,
                    renamedArgs: getRenamedArgsMap(node),
                    resolvedInputs: visit(node, resolvedInstructionInputVisitor),
                };

                // Fragments.
                const instructionDiscriminatorConstantsFragment = getDiscriminatorConstantsFragment({
                    ...scope,
                    discriminatorNodes: node.discriminators ?? [],
                    fields: node.arguments,
                    prefix: node.name,
                });
                const instructionTypeFragment = getInstructionTypeFragment(scope);
                const instructionDataFragment = getInstructionDataFragment(scope);
                const instructionExtraArgsFragment = getInstructionExtraArgsFragment(scope);
                const instructionFunctionAsyncFragment = getInstructionFunctionFragment({
                    ...scope,
                    useAsync: true,
                });
                const instructionFunctionSyncFragment = getInstructionFunctionFragment({
                    ...scope,
                    useAsync: false,
                });
                const instructionParseFunctionFragment = getInstructionParseFunctionFragment(scope);

                // Imports and interfaces.
                const imports = new ImportMap().mergeWith(
                    instructionDiscriminatorConstantsFragment,
                    instructionTypeFragment,
                    instructionDataFragment,
                    instructionExtraArgsFragment,
                    instructionFunctionAsyncFragment,
                    instructionFunctionSyncFragment,
                    instructionParseFunctionFragment,
                );*/
                    return new RenderMap().add(
                        `instructions/${camelCase(node.name)}.ts`,
                        render('instructionsPage.njk', {}),
                    );
                },

                visitPda(node) {
                    const pdaPath = stack.getPath('pdaNode');
                    if (!findProgramNodeFromPath(pdaPath)) {
                        throw new Error('Account must be visited inside a program.');
                    }

                    return new RenderMap().add(`pdas/${camelCase(node.name)}.ts`, render('pdasPage.njk', {}));
                },

                visitProgram(node,{self}) {
                    const scope = { ...globalScope, programNode: node };
                    const imports = new ImportMap().add("solana.publickey","Pubkey");

                    const renderMap = new RenderMap()
                        .mergeWith(...node.pdas.map(p => visit(p, self)))
                        .mergeWith(...node.accounts.map(a => visit(a, self)))
                        .mergeWith(...node.definedTypes.map(t => visit(t, self)));
                        //.mergeWith(...customDataDefinedType.map(t => visit(t, self)));

                    console.log("definedTypes",node.definedTypes);
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
                    const hasAnythingToExport = programsToExport.length > 0 || accountsToExport.length > 0;

                    const ctx = {
                        accountsToExport,
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
                        map.add('accounts/__init.py', render('accountsIndex.njk', ctx));
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
