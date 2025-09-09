import { getAllInstructionsWithSubs, getAllPrograms, snakeCase } from '@codama/nodes';
import { createRenderMap, mergeRenderMaps } from '@codama/renderers-core';
import {
    extendVisitor,
    getByteSizeVisitor,
    LinkableDictionary,
    NodeStack,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    recordNodeStackVisitor,
    staticVisitor,
    visit,
} from '@codama/visitors-core';

import { getInstructionPageFragment, getProgramModPageFragment, getRootModPageFragment } from '../fragments';
import { getInstructionModPageFragment } from '../fragments/instructionModPage';
import { getImportFromFactory, GetRenderMapOptions, getTraitsFromNodeFactory, RenderScope } from '../utils';
import { getTypeManifestVisitor } from './getTypeManifestVisitor';

export function getRenderMapVisitor(options: GetRenderMapOptions = {}) {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();

    const renderParentInstructions = options.renderParentInstructions ?? false;
    const dependencyMap = options.dependencyMap ?? {};
    const getImportFrom = getImportFromFactory(options.linkOverrides ?? {});
    const getTraitsFromNode = getTraitsFromNodeFactory(options.traitOptions);
    const typeManifestVisitor = getTypeManifestVisitor({ getImportFrom, getTraitsFromNode });
    const byteSizeVisitor = getByteSizeVisitor(linkables, { stack });

    const renderScope: RenderScope = {
        byteSizeVisitor,
        dependencyMap,
        getImportFrom,
        getTraitsFromNode,
        linkables,
        renderParentInstructions,
        typeManifestVisitor,
    };

    return pipe(
        staticVisitor(() => createRenderMap(), {
            keys: ['rootNode', 'programNode', 'instructionNode', 'accountNode', 'definedTypeNode'],
        }),
        v =>
            extendVisitor(v, {
                visitInstruction(node) {
                    const instructionPath = stack.getPath('instructionNode');
                    return createRenderMap(
                        `instructions/${snakeCase(node.name)}.rs`,
                        getInstructionPageFragment({ ...renderScope, instructionPath }),
                    );
                },

                visitProgram(node, { self }) {
                    return mergeRenderMaps([
                        ...getAllInstructionsWithSubs(node, {
                            leavesOnly: !renderParentInstructions,
                        }).map(ix => visit(ix, self)),
                    ]);
                },

                visitRoot(node, { self }) {
                    const programsToExport = getAllPrograms(node);
                    const instructionsToExport = getAllInstructionsWithSubs(node, {
                        leavesOnly: !renderParentInstructions,
                    });
                    const scope = { ...renderScope, instructionsToExport, programsToExport };

                    return mergeRenderMaps([
                        createRenderMap({
                            ['instructions/mod.rs']: getInstructionModPageFragment({
                                ...renderScope,
                                instructions: instructionsToExport,
                            }),
                            ['mod.rs']: getRootModPageFragment(scope),
                            ['programs/mod.rs']: getProgramModPageFragment(scope),
                        }),
                        ...programsToExport.map(p => visit(p, self)),
                    ]);
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
