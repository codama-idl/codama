import { camelCase } from '@codama/nodes';
import { addToRenderMap, fragmentToRenderMap, mergeRenderMaps, renderMap } from '@codama/renderers-core';
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
    getAccountPageFragment,
    getDefinedTypePageFragment,
    getInstructionPageFragment,
    getPdaPageFragment,
    getProgramPageFragment,
} from '../fragments';
import { RenderMapOptions } from '../utils';
import { getTypeVisitor } from './getTypeVisitor';
import { getValueVisitor } from './getValueVisitor';

export function getRenderMapVisitor(options: RenderMapOptions = {}) {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();

    const extension = options.extension ?? 'md';
    const indexFilename = options.indexFilename ?? 'README';
    const typeVisitor = getTypeVisitor({ stack, typeIndent: options.typeIndent });
    const valueVisitor = getValueVisitor({ stack });
    const byteSizeVisitor = getByteSizeVisitor(linkables, { stack });

    return pipe(
        staticVisitor(() => renderMap(), {
            keys: ['rootNode', 'programNode', 'pdaNode', 'accountNode', 'definedTypeNode', 'instructionNode'],
        }),
        v =>
            extendVisitor(v, {
                visitAccount(node) {
                    const pda = node.pda ? linkables.get([...stack.getPath(), node.pda]) : undefined;
                    const size = visit(node, byteSizeVisitor);
                    return fragmentToRenderMap(
                        getAccountPageFragment(node, typeVisitor, size ?? undefined, pda),
                        `accounts/${camelCase(node.name)}.${extension}`,
                    );
                },

                visitDefinedType(node) {
                    return fragmentToRenderMap(
                        getDefinedTypePageFragment(node, typeVisitor),
                        `definedTypes/${camelCase(node.name)}.${extension}`,
                    );
                },

                visitInstruction(node) {
                    return fragmentToRenderMap(
                        getInstructionPageFragment(node, typeVisitor),
                        `instructions/${camelCase(node.name)}.${extension}`,
                    );
                },

                visitPda(node) {
                    return fragmentToRenderMap(
                        getPdaPageFragment(node, typeVisitor, valueVisitor),
                        `pdas/${camelCase(node.name)}.${extension}`,
                    );
                },

                visitProgram(node, { self }) {
                    const children = mergeRenderMaps([
                        ...node.accounts.map(n => visit(n, self)),
                        ...node.definedTypes.map(n => visit(n, self)),
                        ...node.instructions.map(n => visit(n, self)),
                        ...node.pdas.map(n => visit(n, self)),
                    ]);
                    return addToRenderMap(children, `${indexFilename}.${extension}`, getProgramPageFragment(node));
                },

                visitRoot(node, { self }) {
                    // Here, we ignore `node.additionalPrograms` for simplicity.
                    return visit(node.program, self);
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
