import {
    camelCase,
    CamelCaseString,
    getAllAccounts,
    getAllDefinedTypes,
    getAllInstructionsWithSubs,
    getAllPdas,
    getAllPrograms,
} from '@codama/nodes';
import { fragmentToRenderMap, mergeRenderMaps, renderMap } from '@codama/renderers-core';
import {
    extendVisitor,
    getByteSizeVisitor,
    getResolvedInstructionInputsVisitor,
    LinkableDictionary,
    NodeStack,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    recordNodeStackVisitor,
    staticVisitor,
    visit,
} from '@codama/visitors-core';

import {
    getAccountPageFragment,
    getErrorPageFragment,
    getIndexPageFragment,
    getInstructionPageFragment,
    getPdaPageFragment,
    getProgramPageFragment,
    getRootIndexPageFragment,
    getSharedPageFragment,
    getTypePageFragment,
} from './fragments';
import { getTypeManifestVisitor } from './getTypeManifestVisitor';
import {
    DEFAULT_NAME_TRANSFORMERS,
    getDefinedTypeNodesToExtract,
    getImportFromFactory,
    getNameApi,
    GetRenderMapOptions,
    parseCustomDataOptions,
    RenderScope,
} from './utils';

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

    const typeManifestVisitor = getTypeManifestVisitor({
        customAccountData,
        customInstructionData,
        getImportFrom,
        linkables,
        nameApi,
        nonScalarEnums,
        stack,
    });
    const resolvedInstructionInputVisitor = getResolvedInstructionInputsVisitor();
    const byteSizeVisitor = getByteSizeVisitor(linkables, { stack });

    const renderScope: RenderScope = {
        asyncResolvers,
        customAccountData,
        customInstructionData,
        dependencyMap,
        getImportFrom,
        linkables,
        nameApi,
        nonScalarEnums,
        renderParentInstructions,
        typeManifestVisitor,
        useGranularImports,
    };

    return pipe(
        staticVisitor(() => renderMap(), {
            keys: ['rootNode', 'programNode', 'pdaNode', 'accountNode', 'definedTypeNode', 'instructionNode'],
        }),
        v =>
            extendVisitor(v, {
                visitAccount(node) {
                    return fragmentToRenderMap(
                        getAccountPageFragment({
                            ...renderScope,
                            accountPath: stack.getPath('accountNode'),
                            size: visit(node, byteSizeVisitor),
                        }),
                        `accounts/${camelCase(node.name)}.ts`,
                    );
                },

                visitDefinedType(node) {
                    return fragmentToRenderMap(
                        getTypePageFragment({ ...renderScope, node, size: visit(node, byteSizeVisitor) }),
                        `types/${camelCase(node.name)}.ts`,
                    );
                },

                visitInstruction(node) {
                    return fragmentToRenderMap(
                        getInstructionPageFragment({
                            ...renderScope,
                            instructionPath: stack.getPath('instructionNode'),
                            resolvedInputs: visit(node, resolvedInstructionInputVisitor),
                            size: visit(node, byteSizeVisitor),
                        }),
                        `instructions/${camelCase(node.name)}.ts`,
                    );
                },

                visitPda(node) {
                    return fragmentToRenderMap(
                        getPdaPageFragment({ ...renderScope, pdaPath: stack.getPath('pdaNode') }),
                        `pdas/${camelCase(node.name)}.ts`,
                    );
                },

                visitProgram(node, { self }) {
                    const customDataDefinedType = [
                        ...getDefinedTypeNodesToExtract(node.accounts, customAccountData),
                        ...getDefinedTypeNodesToExtract(node.instructions, customInstructionData),
                    ];
                    const scope = { ...renderScope, programNode: node };

                    return mergeRenderMaps([
                        fragmentToRenderMap(getProgramPageFragment(scope), `programs/${camelCase(node.name)}.ts`),
                        ...(node.errors.length > 0
                            ? [fragmentToRenderMap(getErrorPageFragment(scope), `errors/${camelCase(node.name)}.ts`)]
                            : []),
                        ...node.pdas.map(p => visit(p, self)),
                        ...node.accounts.map(a => visit(a, self)),
                        ...node.definedTypes.map(t => visit(t, self)),
                        ...customDataDefinedType.map(t => visit(t, self)),
                        ...getAllInstructionsWithSubs(node, { leavesOnly: !renderParentInstructions }).map(i =>
                            visit(i, self),
                        ),
                    ]);
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

                    const scope = {
                        ...renderScope,
                        accountsToExport,
                        definedTypesToExport,
                        instructionsToExport,
                        pdasToExport,
                        programsToExport,
                    };

                    return mergeRenderMaps([
                        fragmentToRenderMap(getRootIndexPageFragment(scope), 'index.ts'),
                        ...(accountsToExport.length > 0
                            ? [fragmentToRenderMap(getIndexPageFragment(accountsToExport, scope), 'accounts/index.ts')]
                            : []),
                        ...(programsWithErrorsToExport.length > 0
                            ? [
                                  fragmentToRenderMap(
                                      getIndexPageFragment(programsWithErrorsToExport, scope),
                                      'errors/index.ts',
                                  ),
                              ]
                            : []),
                        ...(instructionsToExport.length > 0
                            ? [
                                  fragmentToRenderMap(
                                      getIndexPageFragment(instructionsToExport, scope),
                                      'instructions/index.ts',
                                  ),
                              ]
                            : []),
                        ...(pdasToExport.length > 0
                            ? [fragmentToRenderMap(getIndexPageFragment(pdasToExport, scope), 'pdas/index.ts')]
                            : []),
                        ...(programsToExport.length > 0
                            ? [fragmentToRenderMap(getIndexPageFragment(programsToExport, scope), 'programs/index.ts')]
                            : []),
                        ...(hasAnythingToExport
                            ? [fragmentToRenderMap(getSharedPageFragment(scope), 'shared/index.ts')]
                            : []),
                        ...(definedTypesToExport.length > 0
                            ? [fragmentToRenderMap(getIndexPageFragment(definedTypesToExport, scope), 'types/index.ts')]
                            : []),
                        ...getAllPrograms(node).map(p => visit(p, self)),
                    ]);
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
