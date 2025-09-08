import { logWarn } from '@codama/errors';
import { camelCase, definedTypeNode, InstructionNode, structTypeNodeFromInstructionArgumentNodes } from '@codama/nodes';
import {
    findProgramNodeFromPath,
    getLastNodeFromPath,
    NodePath,
    ResolvedInstructionInput,
    visit,
} from '@codama/visitors-core';

import { Fragment, mergeFragments, RenderScope } from '../utils';
import { getDiscriminatorConstantsFragment } from './discriminatorConstants';
import { getInstructionDataFragment } from './instructionData';
import { getInstructionExtraArgsFragment } from './instructionExtraArgs';
import { getInstructionFunctionFragment } from './instructionFunction';
import { getInstructionParseFunctionFragment } from './instructionParseFunction';
import { getInstructionTypeFragment } from './instructionType';

export function getInstructionPageFragment(
    scope: Pick<
        RenderScope,
        'asyncResolvers' | 'customInstructionData' | 'getImportFrom' | 'linkables' | 'nameApi' | 'typeManifestVisitor'
    > & {
        instructionPath: NodePath<InstructionNode>;
        resolvedInputs: ResolvedInstructionInput[];
        size: number | null;
    },
): Fragment {
    const node = getLastNodeFromPath(scope.instructionPath);
    if (!findProgramNodeFromPath(scope.instructionPath)) {
        throw new Error('Instruction must be visited inside a program.');
    }

    const childScope = {
        ...scope,
        dataArgsManifest: visit(node, scope.typeManifestVisitor),
        extraArgsManifest: visit(
            definedTypeNode({
                name: scope.nameApi.instructionExtraType(node.name),
                type: structTypeNodeFromInstructionArgumentNodes(node.extraArguments ?? []),
            }),
            scope.typeManifestVisitor,
        ),
        renamedArgs: getRenamedArgsMap(node),
    };

    return mergeFragments(
        [
            getDiscriminatorConstantsFragment({
                ...childScope,
                discriminatorNodes: node.discriminators ?? [],
                fields: node.arguments,
                prefix: node.name,
            }),
            getInstructionTypeFragment(childScope),
            getInstructionDataFragment(childScope),
            getInstructionExtraArgsFragment(childScope),
            getInstructionFunctionFragment({ ...childScope, useAsync: true }),
            getInstructionFunctionFragment({ ...childScope, useAsync: false }),
            getInstructionParseFunctionFragment(childScope),
        ],
        cs => cs.join('\n\n'),
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
