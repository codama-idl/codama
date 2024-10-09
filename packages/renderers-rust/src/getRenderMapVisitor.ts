import { logWarn } from '@codama/errors';
import {
    getAllAccounts,
    getAllDefinedTypes,
    getAllInstructionsWithSubs,
    getAllPrograms,
    InstructionNode,
    isNode,
    isNodeFilter,
    pascalCase,
    ProgramNode,
    resolveNestedTypeNode,
    snakeCase,
    structTypeNodeFromInstructionArgumentNodes,
    VALUE_NODES,
} from '@codama/nodes';
import { RenderMap } from '@codama/renderers-core';
import {
    extendVisitor,
    LinkableDictionary,
    pipe,
    recordLinkablesVisitor,
    staticVisitor,
    visit,
} from '@codama/visitors-core';

import { getTypeManifestVisitor } from './getTypeManifestVisitor';
import { ImportMap } from './ImportMap';
import { renderValueNode } from './renderValueNodeVisitor';
import { getImportFromFactory, LinkOverrides, render } from './utils';

export type GetRenderMapOptions = {
    dependencyMap?: Record<string, string>;
    linkOverrides?: LinkOverrides;
    renderParentInstructions?: boolean;
};

export function getRenderMapVisitor(options: GetRenderMapOptions = {}) {
    const linkables = new LinkableDictionary();
    let program: ProgramNode | null = null;

    const renderParentInstructions = options.renderParentInstructions ?? false;
    const dependencyMap = options.dependencyMap ?? {};
    const getImportFrom = getImportFromFactory(options.linkOverrides ?? {});
    const typeManifestVisitor = getTypeManifestVisitor({ getImportFrom });

    return pipe(
        staticVisitor(
            () => new RenderMap(),
            ['rootNode', 'programNode', 'instructionNode', 'accountNode', 'definedTypeNode'],
        ),
        v =>
            extendVisitor(v, {
                visitAccount(node) {
                    const typeManifest = visit(node, typeManifestVisitor);

                    // Seeds.
                    const seedsImports = new ImportMap();
                    const pda = node.pda ? linkables.get(node.pda) : undefined;
                    const pdaSeeds = pda?.seeds ?? [];
                    const seeds = pdaSeeds.map(seed => {
                        if (isNode(seed, 'variablePdaSeedNode')) {
                            const seedManifest = visit(seed.type, typeManifestVisitor);
                            seedsImports.mergeWith(seedManifest.imports);
                            const resolvedType = resolveNestedTypeNode(seed.type);
                            return { ...seed, resolvedType, typeManifest: seedManifest };
                        }
                        if (isNode(seed.value, 'programIdValueNode')) {
                            return seed;
                        }
                        const seedManifest = visit(seed.type, typeManifestVisitor);
                        const valueManifest = renderValueNode(seed.value, getImportFrom, true);
                        seedsImports.mergeWith(valueManifest.imports);
                        const resolvedType = resolveNestedTypeNode(seed.type);
                        return { ...seed, resolvedType, typeManifest: seedManifest, valueManifest };
                    });
                    const hasVariableSeeds = pdaSeeds.filter(isNodeFilter('variablePdaSeedNode')).length > 0;
                    const constantSeeds = seeds
                        .filter(isNodeFilter('constantPdaSeedNode'))
                        .filter(seed => !isNode(seed.value, 'programIdValueNode'));

                    const { imports } = typeManifest;

                    if (hasVariableSeeds) {
                        imports.mergeWith(seedsImports);
                    }

                    return new RenderMap().add(
                        `accounts/${snakeCase(node.name)}.rs`,
                        render('accountsPage.njk', {
                            account: node,
                            constantSeeds,
                            hasVariableSeeds,
                            imports: imports
                                .remove(`generatedAccounts::${pascalCase(node.name)}`)
                                .toString(dependencyMap),
                            pda,
                            program,
                            seeds,
                            typeManifest,
                        }),
                    );
                },

                visitDefinedType(node) {
                    const typeManifest = visit(node, typeManifestVisitor);
                    const imports = new ImportMap().mergeWithManifest(typeManifest);

                    return new RenderMap().add(
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
                    imports.add(['borsh::BorshDeserialize', 'borsh::BorshSerialize']);

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
                        type: string;
                        value: string | null;
                    }[] = [];
                    let hasArgs = false;
                    let hasOptional = false;

                    node.arguments.forEach(argument => {
                        const argumentVisitor = getTypeManifestVisitor({
                            getImportFrom,
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
                            type: manifest.type,
                            value: renderValue,
                        });
                    });

                    const struct = structTypeNodeFromInstructionArgumentNodes(node.arguments);
                    const structVisitor = getTypeManifestVisitor({
                        getImportFrom,
                        parentName: `${pascalCase(node.name)}InstructionData`,
                    });
                    const typeManifest = visit(struct, structVisitor);

                    return new RenderMap().add(
                        `instructions/${snakeCase(node.name)}.rs`,
                        render('instructionsPage.njk', {
                            hasArgs,
                            hasOptional,
                            imports: imports
                                .remove(`generatedInstructions::${pascalCase(node.name)}`)
                                .toString(dependencyMap),
                            instruction: node,
                            instructionArgs,
                            program,
                            typeManifest,
                        }),
                    );
                },

                visitProgram(node, { self }) {
                    program = node;
                    const renderMap = new RenderMap()
                        .mergeWith(...node.accounts.map(account => visit(account, self)))
                        .mergeWith(...node.definedTypes.map(type => visit(type, self)))
                        .mergeWith(
                            ...getAllInstructionsWithSubs(node, {
                                leavesOnly: !renderParentInstructions,
                            }).map(ix => visit(ix, self)),
                        );

                    // Errors.
                    if (node.errors.length > 0) {
                        renderMap.add(
                            `errors/${snakeCase(node.name)}.rs`,
                            render('errorsPage.njk', {
                                errors: node.errors,
                                imports: new ImportMap().toString(dependencyMap),
                                program: node,
                            }),
                        );
                    }

                    program = null;
                    return renderMap;
                },

                visitRoot(node, { self }) {
                    const programsToExport = getAllPrograms(node);
                    const accountsToExport = getAllAccounts(node);
                    const instructionsToExport = getAllInstructionsWithSubs(node, {
                        leavesOnly: !renderParentInstructions,
                    });
                    const definedTypesToExport = getAllDefinedTypes(node);
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
                        programsToExport,
                        root: node,
                    };

                    const map = new RenderMap();
                    if (programsToExport.length > 0) {
                        map.add('programs.rs', render('programsMod.njk', ctx)).add(
                            'errors/mod.rs',
                            render('errorsMod.njk', ctx),
                        );
                    }
                    if (accountsToExport.length > 0) {
                        map.add('accounts/mod.rs', render('accountsMod.njk', ctx));
                    }
                    if (instructionsToExport.length > 0) {
                        map.add('instructions/mod.rs', render('instructionsMod.njk', ctx));
                    }
                    if (definedTypesToExport.length > 0) {
                        map.add('types/mod.rs', render('definedTypesMod.njk', ctx));
                    }

                    return map
                        .add('mod.rs', render('rootMod.njk', ctx))
                        .mergeWith(...getAllPrograms(node).map(p => visit(p, self)));
                },
            }),
        v => recordLinkablesVisitor(v, linkables),
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
