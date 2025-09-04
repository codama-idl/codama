import {
    camelCase,
    CamelCaseString,
    getAllAccounts,
    getAllDefinedTypes,
    getAllInstructionsWithSubs,
    getAllPdas,
    getAllPrograms,
} from '@codama/nodes';
import { fragmentToRenderMap, mergeRenderMaps, Path, RenderMap, renderMap } from '@codama/renderers-core';
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
} from '../fragments';
import {
    DEFAULT_NAME_TRANSFORMERS,
    Fragment,
    getDefinedTypeNodesToExtract,
    getImportFromFactory,
    getNameApi,
    getPageFragment,
    GetRenderMapOptions,
    parseCustomDataOptions,
    RenderScope,
} from '../utils';
import { getTypeManifestVisitor } from './getTypeManifestVisitor';

export function getRenderMapVisitor(options: GetRenderMapOptions = {}) {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();

    const customAccountData = parseCustomDataOptions(options.customAccountData ?? [], 'AccountData');
    const customInstructionData = parseCustomDataOptions(options.customInstructionData ?? [], 'InstructionData');
    const renderScopeWithTypeManifestVisitor: Omit<RenderScope, 'typeManifestVisitor'> = {
        asyncResolvers: (options.asyncResolvers ?? []).map(camelCase),
        customAccountData,
        customInstructionData,
        dependencyMap: options.dependencyMap ?? {},
        getImportFrom: getImportFromFactory(options.linkOverrides ?? {}, customAccountData, customInstructionData),
        linkables,
        nameApi: getNameApi({ ...DEFAULT_NAME_TRANSFORMERS, ...options.nameTransformers }),
        nonScalarEnums: (options.nonScalarEnums ?? []).map(camelCase),
        renderParentInstructions: options.renderParentInstructions ?? false,
        useGranularImports: options.useGranularImports ?? false,
    };

    const typeManifestVisitor = getTypeManifestVisitor({ ...renderScopeWithTypeManifestVisitor, stack });
    const renderScope: RenderScope = { ...renderScopeWithTypeManifestVisitor, typeManifestVisitor };

    const internalNodes = (options.internalNodes ?? []).map(camelCase);
    const resolvedInstructionInputVisitor = getResolvedInstructionInputsVisitor();
    const byteSizeVisitor = getByteSizeVisitor(linkables, { stack });
    const pageFragmentToRenderMap = (f: Fragment, p: Path, dependencyMap: Record<string, string> = {}): RenderMap =>
        fragmentToRenderMap(
            getPageFragment(f, { ...renderScope, dependencyMap: { ...renderScope.dependencyMap, ...dependencyMap } }),
            p,
        );

    return pipe(
        staticVisitor(() => renderMap(), {
            keys: ['rootNode', 'programNode', 'pdaNode', 'accountNode', 'definedTypeNode', 'instructionNode'],
        }),
        v =>
            extendVisitor(v, {
                visitAccount(node) {
                    return pageFragmentToRenderMap(
                        getAccountPageFragment({
                            ...renderScope,
                            accountPath: stack.getPath('accountNode'),
                            size: visit(node, byteSizeVisitor),
                        }),
                        `accounts/${camelCase(node.name)}.ts`,
                    );
                },

                visitDefinedType(node) {
                    return pageFragmentToRenderMap(
                        getTypePageFragment({ ...renderScope, node, size: visit(node, byteSizeVisitor) }),
                        `types/${camelCase(node.name)}.ts`,
                        { generatedTypes: '.' },
                    );
                },

                visitInstruction(node) {
                    return pageFragmentToRenderMap(
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
                    return pageFragmentToRenderMap(
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
                        pageFragmentToRenderMap(getProgramPageFragment(scope), `programs/${camelCase(node.name)}.ts`),
                        ...(node.errors.length > 0
                            ? [
                                  pageFragmentToRenderMap(
                                      getErrorPageFragment(scope),
                                      `errors/${camelCase(node.name)}.ts`,
                                  ),
                              ]
                            : []),
                        ...node.pdas.map(p => visit(p, self)),
                        ...node.accounts.map(a => visit(a, self)),
                        ...node.definedTypes.map(t => visit(t, self)),
                        ...customDataDefinedType.map(t => visit(t, self)),
                        ...getAllInstructionsWithSubs(node, { leavesOnly: !renderScope.renderParentInstructions }).map(
                            i => visit(i, self),
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
                        leavesOnly: !renderScope.renderParentInstructions,
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
                        pageFragmentToRenderMap(getRootIndexPageFragment(scope), 'index.ts'),
                        ...(accountsToExport.length > 0
                            ? [pageFragmentToRenderMap(getIndexPageFragment(accountsToExport), 'accounts/index.ts')]
                            : []),
                        ...(programsWithErrorsToExport.length > 0
                            ? [
                                  pageFragmentToRenderMap(
                                      getIndexPageFragment(programsWithErrorsToExport),
                                      'errors/index.ts',
                                  ),
                              ]
                            : []),
                        ...(instructionsToExport.length > 0
                            ? [
                                  pageFragmentToRenderMap(
                                      getIndexPageFragment(instructionsToExport),
                                      'instructions/index.ts',
                                  ),
                              ]
                            : []),
                        ...(pdasToExport.length > 0
                            ? [pageFragmentToRenderMap(getIndexPageFragment(pdasToExport), 'pdas/index.ts')]
                            : []),
                        ...(programsToExport.length > 0
                            ? [pageFragmentToRenderMap(getIndexPageFragment(programsToExport), 'programs/index.ts')]
                            : []),
                        ...(hasAnythingToExport
                            ? [pageFragmentToRenderMap(getSharedPageFragment(), 'shared/index.ts')]
                            : []),
                        ...(definedTypesToExport.length > 0
                            ? [pageFragmentToRenderMap(getIndexPageFragment(definedTypesToExport), 'types/index.ts')]
                            : []),
                        ...getAllPrograms(node).map(p => visit(p, self)),
                    ]);
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
