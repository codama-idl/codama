import { join } from 'node:path';

import { logWarn } from '@codama/errors';
import {
    camelCase,
    CamelCaseString,
    getAllAccounts,
    getAllDefinedTypes,
    getAllInstructionsWithSubs,
    getAllPdas,
    getAllPrograms,
    InstructionNode,
    resolveNestedTypeNode,
    structTypeNodeFromInstructionArgumentNodes,
} from '@codama/nodes';
import { RenderMap } from '@codama/renderers-core';
import {
    extendVisitor,
    findProgramNodeFromPath,
    getResolvedInstructionInputsVisitor,
    LinkableDictionary,
    NodeStack,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    recordNodeStackVisitor,
    staticVisitor,
    visit,
} from '@codama/visitors-core';
import type { ConfigureOptions } from 'nunjucks';

import {
    getAccountFetchHelpersFragment,
    getAccountPdaHelpersFragment,
    getAccountSizeHelpersFragment,
    getAccountTypeFragment,
    getDiscriminatorConstantsFragment,
    getInstructionDataFragment,
    getInstructionExtraArgsFragment,
    getInstructionFunctionFragment,
    getInstructionParseFunctionFragment,
    getInstructionTypeFragment,
    getPdaFunctionFragment,
    getProgramAccountsFragment,
    getProgramErrorsFragment,
    getProgramFragment,
    getProgramInstructionsFragment,
    getTypeDiscriminatedUnionHelpersFragment,
    getTypeWithCodecFragment,
} from './fragments';
import { getTypeManifestVisitor as baseGetTypeManifestVisitor, TypeManifestVisitor } from './getTypeManifestVisitor';
import { ImportMap } from './ImportMap';
import { DEFAULT_NAME_TRANSFORMERS, getNameApi, NameApi, NameTransformers } from './nameTransformers';
import {
    CustomDataOptions,
    getDefinedTypeNodesToExtract,
    getImportFromFactory,
    GetImportFromFunction,
    LinkOverrides,
    parseCustomDataOptions,
    ParsedCustomDataOptions,
    render as baseRender,
} from './utils';

export type GetRenderMapOptions = {
    asyncResolvers?: string[];
    customAccountData?: CustomDataOptions[];
    customInstructionData?: CustomDataOptions[];
    dependencyMap?: Record<string, string>;
    internalNodes?: string[];
    linkOverrides?: LinkOverrides;
    nameTransformers?: Partial<NameTransformers>;
    nonScalarEnums?: string[];
    renderParentInstructions?: boolean;
    useGranularImports?: boolean;
};

export type GlobalFragmentScope = {
    asyncResolvers: CamelCaseString[];
    customAccountData: ParsedCustomDataOptions;
    customInstructionData: ParsedCustomDataOptions;
    getImportFrom: GetImportFromFunction;
    linkables: LinkableDictionary;
    nameApi: NameApi;
    nonScalarEnums: CamelCaseString[];
    renderParentInstructions: boolean;
    typeManifestVisitor: TypeManifestVisitor;
};

export function getRenderMapVisitor(options: GetRenderMapOptions = {}) {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();

    const nameTransformers = {
        ...DEFAULT_NAME_TRANSFORMERS,
        ...options.nameTransformers,
    };
    const nameApi = getNameApi(nameTransformers);
    const renderParentInstructions = options.renderParentInstructions ?? false;
    const dependencyMap = options.dependencyMap ?? {};
    const useGranularImports = options.useGranularImports ?? false;
    const asyncResolvers = (options.asyncResolvers ?? []).map(camelCase);
    const nonScalarEnums = (options.nonScalarEnums ?? []).map(camelCase);
    const internalNodes = (options.internalNodes ?? []).map(camelCase);
    const customAccountData = parseCustomDataOptions(options.customAccountData ?? [], 'AccountData');
    const customInstructionData = parseCustomDataOptions(options.customInstructionData ?? [], 'InstructionData');
    const getImportFrom = getImportFromFactory(options.linkOverrides ?? {}, customAccountData, customInstructionData);

    const getTypeManifestVisitor = (parentName?: { loose: string; strict: string }) =>
        baseGetTypeManifestVisitor({
            customAccountData,
            customInstructionData,
            getImportFrom,
            linkables,
            nameApi,
            nonScalarEnums,
            parentName,
            stack,
        });
    const typeManifestVisitor = getTypeManifestVisitor();
    const resolvedInstructionInputVisitor = getResolvedInstructionInputsVisitor();

    const globalScope: GlobalFragmentScope = {
        asyncResolvers,
        customAccountData,
        customInstructionData,
        getImportFrom,
        linkables,
        nameApi,
        nonScalarEnums,
        renderParentInstructions,
        typeManifestVisitor,
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

                    const scope = {
                        ...globalScope,
                        accountPath,
                        typeManifest: visit(node, typeManifestVisitor),
                    };

                    const fields = resolveNestedTypeNode(node.data).fields;
                    const accountDiscriminatorConstantsFragment = getDiscriminatorConstantsFragment({
                        ...scope,
                        discriminatorNodes: node.discriminators ?? [],
                        fields,
                        prefix: node.name,
                    });
                    const accountTypeFragment = getAccountTypeFragment(scope);
                    const accountFetchHelpersFragment = getAccountFetchHelpersFragment(scope);
                    const accountSizeHelpersFragment = getAccountSizeHelpersFragment(scope);
                    const accountPdaHelpersFragment = getAccountPdaHelpersFragment(scope);
                    const imports = new ImportMap().mergeWith(
                        accountDiscriminatorConstantsFragment,
                        accountTypeFragment,
                        accountFetchHelpersFragment,
                        accountSizeHelpersFragment,
                        accountPdaHelpersFragment,
                    );

                    return new RenderMap().add(
                        `accounts/${camelCase(node.name)}.ts`,
                        render('accountsPage.njk', {
                            accountDiscriminatorConstantsFragment,
                            accountFetchHelpersFragment,
                            accountPdaHelpersFragment,
                            accountSizeHelpersFragment,
                            accountTypeFragment,
                            imports: imports.toString(dependencyMap, useGranularImports),
                        }),
                    );
                },

                visitDefinedType(node) {
                    const scope = {
                        ...globalScope,
                        codecDocs: [],
                        decoderDocs: [],
                        encoderDocs: [],
                        manifest: visit(node, typeManifestVisitor),
                        name: node.name,
                        typeDocs: node.docs,
                        typeNode: node.type,
                    };

                    const typeWithCodecFragment = getTypeWithCodecFragment(scope);
                    const typeDiscriminatedUnionHelpersFragment = getTypeDiscriminatedUnionHelpersFragment(scope);
                    const imports = new ImportMap()
                        .mergeWith(typeWithCodecFragment, typeDiscriminatedUnionHelpersFragment)
                        .remove('generatedTypes', [
                            nameApi.dataType(node.name),
                            nameApi.dataArgsType(node.name),
                            nameApi.encoderFunction(node.name),
                            nameApi.decoderFunction(node.name),
                            nameApi.codecFunction(node.name),
                        ]);

                    return new RenderMap().add(
                        `types/${camelCase(node.name)}.ts`,
                        render('definedTypesPage.njk', {
                            imports: imports.toString({
                                ...dependencyMap,
                                generatedTypes: '.',
                            }),
                            typeDiscriminatedUnionHelpersFragment,
                            typeWithCodecFragment,
                        }),
                    );
                },

                visitInstruction(node) {
                    const instructionPath = stack.getPath('instructionNode');
                    if (!findProgramNodeFromPath(instructionPath)) {
                        throw new Error('Instruction must be visited inside a program.');
                    }

                    const instructionExtraName = nameApi.instructionExtraType(node.name);
                    const scope = {
                        ...globalScope,
                        dataArgsManifest: visit(node, typeManifestVisitor),
                        extraArgsManifest: visit(
                            structTypeNodeFromInstructionArgumentNodes(node.extraArguments ?? []),
                            getTypeManifestVisitor({
                                loose: nameApi.dataArgsType(instructionExtraName),
                                strict: nameApi.dataType(instructionExtraName),
                            }),
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
                    );

                    return new RenderMap().add(
                        `instructions/${camelCase(node.name)}.ts`,
                        render('instructionsPage.njk', {
                            imports: imports.toString(dependencyMap, useGranularImports),
                            instruction: node,
                            instructionDataFragment,
                            instructionDiscriminatorConstantsFragment,
                            instructionExtraArgsFragment,
                            instructionFunctionAsyncFragment,
                            instructionFunctionSyncFragment,
                            instructionParseFunctionFragment,
                            instructionTypeFragment,
                        }),
                    );
                },

                visitPda(node) {
                    const pdaPath = stack.getPath('pdaNode');
                    if (!findProgramNodeFromPath(pdaPath)) {
                        throw new Error('Account must be visited inside a program.');
                    }

                    const scope = { ...globalScope, pdaPath };
                    const pdaFunctionFragment = getPdaFunctionFragment(scope);
                    const imports = new ImportMap().mergeWith(pdaFunctionFragment);

                    return new RenderMap().add(
                        `pdas/${camelCase(node.name)}.ts`,
                        render('pdasPage.njk', {
                            imports: imports.toString(dependencyMap, useGranularImports),
                            pdaFunctionFragment,
                        }),
                    );
                },

                visitProgram(node, { self }) {
                    const customDataDefinedType = [
                        ...getDefinedTypeNodesToExtract(node.accounts, customAccountData),
                        ...getDefinedTypeNodesToExtract(node.instructions, customInstructionData),
                    ];
                    const scope = { ...globalScope, programNode: node };
                    const renderMap = new RenderMap()
                        .mergeWith(...node.pdas.map(p => visit(p, self)))
                        .mergeWith(...node.accounts.map(a => visit(a, self)))
                        .mergeWith(...node.definedTypes.map(t => visit(t, self)))
                        .mergeWith(...customDataDefinedType.map(t => visit(t, self)));

                    if (node.errors.length > 0) {
                        const programErrorsFragment = getProgramErrorsFragment(scope);
                        renderMap.add(
                            `errors/${camelCase(node.name)}.ts`,
                            render('errorsPage.njk', {
                                imports: new ImportMap()
                                    .mergeWith(programErrorsFragment)
                                    .toString(dependencyMap, useGranularImports),
                                programErrorsFragment,
                            }),
                        );
                    }

                    const programFragment = getProgramFragment(scope);
                    const programAccountsFragment = getProgramAccountsFragment(scope);
                    const programInstructionsFragment = getProgramInstructionsFragment(scope);
                    renderMap.add(
                        `programs/${camelCase(node.name)}.ts`,
                        render('programsPage.njk', {
                            imports: new ImportMap()
                                .mergeWith(programFragment, programAccountsFragment, programInstructionsFragment)
                                .toString(dependencyMap, useGranularImports),
                            programAccountsFragment,
                            programFragment,
                            programInstructionsFragment,
                        }),
                    );

                    renderMap.mergeWith(
                        ...getAllInstructionsWithSubs(node, {
                            leavesOnly: !renderParentInstructions,
                        }).map(ix => visit(ix, self)),
                    );
                    return renderMap;
                },

                visitRoot(node, { self }) {
                    const isNotInternal = (n: { name: CamelCaseString }) => !internalNodes.includes(n.name);
                    const programsToExport = getAllPrograms(node).filter(isNotInternal);
                    const programsWithErrorsToExport = programsToExport.filter(p => p.errors.length > 0);
                    const pdasToExport = getAllPdas(node);
                    const accountsToExport = getAllAccounts(node).filter(isNotInternal);
                    const instructionsToExport = getAllInstructionsWithSubs(node, {
                        leavesOnly: !renderParentInstructions,
                    }).filter(isNotInternal);
                    const definedTypesToExport = getAllDefinedTypes(node).filter(isNotInternal);
                    const hasAnythingToExport =
                        programsToExport.length > 0 ||
                        accountsToExport.length > 0 ||
                        instructionsToExport.length > 0 ||
                        definedTypesToExport.length > 0;

                    const ctx = {
                        accountsToExport,
                        definedTypesToExport,
                        hasAnythingToExport,
                        instructionsToExport,
                        pdasToExport,
                        programsToExport,
                        programsWithErrorsToExport,
                        root: node,
                    };

                    const map = new RenderMap();
                    if (hasAnythingToExport) {
                        map.add(
                            'shared/index.ts',
                            render('sharedPage.njk', {
                                ...ctx,
                                imports: new ImportMap()
                                    .add('solanaAddresses', [
                                        'type Address',
                                        'isProgramDerivedAddress',
                                        'type ProgramDerivedAddress',
                                    ])
                                    .add('solanaInstructions', [
                                        'AccountRole',
                                        'type IAccountMeta',
                                        'upgradeRoleToSigner',
                                    ])
                                    .add('solanaSigners', [
                                        'type IAccountSignerMeta',
                                        'isTransactionSigner',
                                        'type TransactionSigner',
                                    ])
                                    .addAlias('solanaSigners', 'isTransactionSigner', 'web3JsIsTransactionSigner')
                                    .toString(dependencyMap, useGranularImports),
                            }),
                        );
                    }
                    if (programsToExport.length > 0) {
                        map.add('programs/index.ts', render('programsIndex.njk', ctx));
                    }
                    if (programsWithErrorsToExport.length > 0) {
                        map.add('errors/index.ts', render('errorsIndex.njk', ctx));
                    }
                    if (accountsToExport.length > 0) {
                        map.add('accounts/index.ts', render('accountsIndex.njk', ctx));
                    }
                    if (pdasToExport.length > 0) {
                        map.add('pdas/index.ts', render('pdasIndex.njk', ctx));
                    }
                    if (instructionsToExport.length > 0) {
                        map.add('instructions/index.ts', render('instructionsIndex.njk', ctx));
                    }
                    if (definedTypesToExport.length > 0) {
                        map.add('types/index.ts', render('definedTypesIndex.njk', ctx));
                    }

                    return map
                        .add('index.ts', render('rootIndex.njk', ctx))
                        .mergeWith(...getAllPrograms(node).map(p => visit(p, self)));
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}

function getRenamedArgsMap(instruction: InstructionNode): Map<string, string> {
    const argNames = [
        ...instruction.arguments.map(a => a.name),
        ...(instruction.extraArguments ?? []).map(a => a.name),
    ];
    const duplicateArgs = argNames.filter((e, i, a) => a.indexOf(e) !== i);
    if (duplicateArgs.length > 0) {
        throw new Error(`Duplicate args found: [${duplicateArgs.join(', ')}] in instruction [${instruction.name}].`);
    }

    const allNames = [...instruction.accounts.map(account => account.name), ...argNames];
    const duplicates = allNames.filter((e, i, a) => a.indexOf(e) !== i);
    if (duplicates.length === 0) return new Map();

    logWarn(
        `[JavaScript] Accounts and args of instruction [${instruction.name}] have the following ` +
            `conflicting attributes [${duplicates.join(', ')}]. ` +
            `Thus, the arguments have been renamed to avoid conflicts in the input type.`,
    );

    return new Map(duplicates.map(name => [camelCase(name), camelCase(`${name}Arg`)]));
}
