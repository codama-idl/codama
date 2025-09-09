import { getAllInstructionsWithSubs, getAllPrograms, snakeCase } from '@codama/nodes';
import { fragmentToRenderMap, mergeRenderMaps, renderMap } from '@codama/renderers-core';
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

import {
    getInstructionPageFragment,
    getProgramModPageFragment,
    getRootModPageFragment,
} from '../fragments';
import { getImportFromFactory, GetRenderMapOptions, getTraitsFromNodeFactory, RenderScope } from '../utils';
import { getTypeManifestVisitor } from './getTypeManifestVisitor';
import { getInstructionModPageFragment } from '../fragments/instructionModPage';

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
        staticVisitor(() => renderMap(), {
            keys: ['rootNode', 'programNode', 'instructionNode', 'accountNode', 'definedTypeNode'],
        }),
        v =>
            extendVisitor(v, {
                visitInstruction(node) {
                    const instructionPath = stack.getPath('instructionNode');
                    return fragmentToRenderMap(
                        getInstructionPageFragment({ ...renderScope, instructionPath }),
                        `instructions/${snakeCase(node.name)}.rs`,
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

                    const rootMod = getRootModPageFragment(scope);
                    const programsMod = getProgramModPageFragment(scope);
                    const instructionsMod = getInstructionModPageFragment({ ...renderScope, instructions: instructionsToExport });

                    return mergeRenderMaps([
                        // mod.rs
                        ...(rootMod ? [fragmentToRenderMap(rootMod, 'mod.rs')] : []),
                        // programs/mod.rs
                        ...(programsMod ? [fragmentToRenderMap(programsMod, 'programs/mod.rs')] : []),
                        // instructions/mod.rs
                        ...(instructionsMod ? [fragmentToRenderMap(instructionsMod, 'instructions/mod.rs')] : []),
                        // Rest of the generated content.
                        ...programsToExport.map(p => visit(p, self)),
                    ]);
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
