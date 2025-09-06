import { logWarn } from '@codama/errors';
import {
    getAllInstructionsWithSubs,
    getAllPrograms,
    InstructionNode,
    isNode,
    pascalCase,
    ProgramNode,
    snakeCase,
    structTypeNodeFromInstructionArgumentNodes,
    VALUE_NODES,
} from '@codama/nodes';
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

import { getRootModPageFragment } from './fragments';
import { getModPageFragment } from './fragments/modPage';
import { getProgramModPageFragment } from './fragments/programModPage';
import { getTypeManifestVisitor } from './getTypeManifestVisitor';
import { ImportMap } from './ImportMap';
import { renderValueNode } from './renderValueNodeVisitor';
import { getImportFromFactory, GetRenderMapOptions, getTraitsFromNodeFactory, render, RenderScope } from './utils';

export function getRenderMapVisitor(options: GetRenderMapOptions = {}) {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();
    let program: ProgramNode | null = null;

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
                visitDefinedType(node) {
                    const typeManifest = visit(node, typeManifestVisitor);
                    const imports = new ImportMap().mergeWithManifest(typeManifest);

                    return addToRenderMap(
                        renderMap(),
                        `types/${snakeCase(node.name)}.rs`,
                        render('definedTypesPage.njk', {
                            definedType: node,
                            imports: imports.remove(`generatedTypes::${pascalCase(node.name)}`).toString(dependencyMap),
                            typeManifest,
                        }),
                    );
                },

                visitInstruction(node) {
                    // Imports.
                    const imports = new ImportMap();

                    // canMergeAccountsAndArgs
                    const accountsAndArgsConflicts = getConflictsForInstructionAccountsAndArgs(node);
                    if (accountsAndArgsConflicts.length > 0) {
                        logWarn(
                            `[Rust] Accounts and args of instruction [${node.name}] have the following ` +
                                `conflicting attributes [${accountsAndArgsConflicts.join(', ')}]. ` +
                                `Thus, the conflicting arguments will be suffixed with "_arg". ` +
                                'You may want to rename the conflicting attributes.',
                        );
                    }

                    // Instruction args.
                    const instructionArgs: {
                        default: boolean;
                        innerOptionType: string | null;
                        name: string;
                        optional: boolean;
                        size: number;
                        type: string;
                        value: string | null;
                    }[] = [];
                    let hasArgs = false;
                    let hasOptional = false;

                    node.arguments.forEach(argument => {
                        const argumentVisitor = getTypeManifestVisitor({
                            getImportFrom,
                            getTraitsFromNode,
                            nestedStruct: true,
                            parentName: `${pascalCase(node.name)}InstructionData`,
                        });
                        const manifest = visit(argument.type, argumentVisitor);
                        imports.mergeWith(manifest.imports);
                        const innerOptionType = isNode(argument.type, 'optionTypeNode')
                            ? manifest.type.slice('Option<'.length, -1)
                            : null;

                        const hasDefaultValue = !!argument.defaultValue && isNode(argument.defaultValue, VALUE_NODES);
                        let renderValue: string | null = null;
                        if (hasDefaultValue) {
                            const { imports: argImports, render: value } = renderValueNode(
                                argument.defaultValue,
                                getImportFrom,
                            );
                            imports.mergeWith(argImports);
                            renderValue = value;
                        }

                        hasArgs = hasArgs || argument.defaultValueStrategy !== 'omitted';
                        hasOptional = hasOptional || (hasDefaultValue && argument.defaultValueStrategy !== 'omitted');

                        const name = accountsAndArgsConflicts.includes(argument.name)
                            ? `${argument.name}_arg`
                            : argument.name;

                        instructionArgs.push({
                            default: hasDefaultValue && argument.defaultValueStrategy === 'omitted',
                            innerOptionType,
                            name,
                            optional: hasDefaultValue && argument.defaultValueStrategy !== 'omitted',
                            size: visit(argument.type, byteSizeVisitor) as number, // We fail later if the whole data is variable.
                            type: manifest.type,
                            value: renderValue,
                        });
                    });

                    const struct = structTypeNodeFromInstructionArgumentNodes(node.arguments);
                    const structVisitor = getTypeManifestVisitor({
                        getImportFrom,
                        getTraitsFromNode,
                        parentName: `${pascalCase(node.name)}InstructionData`,
                    });
                    const typeManifest = visit(struct, structVisitor);
                    const instructionSize = visit(struct, byteSizeVisitor);

                    /*
                    if (instructionSize === null) {
                        throw new Error(
                            `[Rust] Cannot compute static byte size for instruction [${node.name}]. ` +
                                'Consider using types with static size for instruction arguments.',
                        );
                    }
                    */

                    return addToRenderMap(
                        renderMap(),
                        `instructions/${snakeCase(node.name)}.rs`,
                        render('instructionPage.njk', {
                            hasArgs,
                            hasOptional,
                            imports: imports
                                .remove(`generatedInstructions::${pascalCase(node.name)}`)
                                .toString(dependencyMap),
                            instruction: node,
                            instructionArgs,
                            instructionSize,
                            program,
                            typeManifest,
                        }),
                    );
                },

                visitProgram(node, { self }) {
                    program = node;
                    const renderMap = mergeRenderMaps([
                        ...node.accounts.map(account => visit(account, self)),
                        ...node.definedTypes.map(type => visit(type, self)),
                        ...getAllInstructionsWithSubs(node, {
                            leavesOnly: !renderParentInstructions,
                        }).map(ix => visit(ix, self)),
                    ]);

                    program = null;
                    return renderMap;
                },

                visitRoot(node, { self }) {
                    const programsToExport = getAllPrograms(node);
                    const instructionsToExport = getAllInstructionsWithSubs(node, {
                        leavesOnly: !renderParentInstructions,
                    });
                    const scope = { ...renderScope, instructionsToExport, programsToExport };

                    const rootMod = getRootModPageFragment(scope);
                    const programsMod = getProgramModPageFragment(scope);
                    const instructionsMod = getModPageFragment({ ...renderScope, items: instructionsToExport });

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

function getConflictsForInstructionAccountsAndArgs(instruction: InstructionNode): string[] {
    const allNames = [
        ...instruction.accounts.map(account => account.name),
        ...instruction.arguments.map(argument => argument.name),
    ];
    const duplicates = allNames.filter((e, i, a) => a.indexOf(e) !== i);
    return [...new Set(duplicates)];
}
