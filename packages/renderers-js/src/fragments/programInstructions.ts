import {
    getAllInstructionsWithSubs,
    InstructionNode,
    ProgramNode,
    structTypeNodeFromInstructionArgumentNodes,
} from '@codama/nodes';
import { mapFragmentContent } from '@codama/renderers-core';
import { pipe } from '@codama/visitors-core';

import { addFragmentImports, Fragment, fragment, mergeFragments, RenderScope, use } from '../utils';
import { getDiscriminatorConditionFragment } from './discriminatorCondition';

export function getProgramInstructionsFragment(
    scope: Pick<RenderScope, 'nameApi' | 'renderParentInstructions' | 'typeManifestVisitor'> & {
        programNode: ProgramNode;
    },
): Fragment | undefined {
    if (scope.programNode.instructions.length === 0) return;

    const allInstructions = getAllInstructionsWithSubs(scope.programNode, {
        leavesOnly: !scope.renderParentInstructions,
        subInstructionsFirst: true,
    });
    const scopeWithInstructions = { ...scope, allInstructions };
    return mergeFragments(
        [
            getProgramInstructionsEnumFragment(scopeWithInstructions),
            getProgramInstructionsIdentifierFunctionFragment(scopeWithInstructions),
            getProgramInstructionsParsedUnionTypeFragment(scopeWithInstructions),
        ],
        c => c.join('\n\n'),
    );
}

function getProgramInstructionsEnumFragment(
    scope: Pick<RenderScope, 'nameApi'> & {
        allInstructions: InstructionNode[];
        programNode: ProgramNode;
    },
): Fragment {
    const { programNode, allInstructions, nameApi } = scope;
    const programInstructionsEnum = nameApi.programInstructionsEnum(programNode.name);
    const programInstructionsEnumVariants = allInstructions.map(instruction =>
        nameApi.programInstructionsEnumVariant(instruction.name),
    );
    return fragment`export enum ${programInstructionsEnum} { ${programInstructionsEnumVariants.join(', ')} }`;
}

function getProgramInstructionsIdentifierFunctionFragment(
    scope: Pick<RenderScope, 'nameApi' | 'typeManifestVisitor'> & {
        allInstructions: InstructionNode[];
        programNode: ProgramNode;
    },
): Fragment | undefined {
    const { programNode, nameApi, allInstructions } = scope;
    const instructionsWithDiscriminators = allInstructions.filter(
        instruction => (instruction.discriminators ?? []).length > 0,
    );
    const hasInstructionDiscriminators = instructionsWithDiscriminators.length > 0;
    if (!hasInstructionDiscriminators) return;

    const programInstructionsEnum = nameApi.programInstructionsEnum(programNode.name);
    const programInstructionsIdentifierFunction = nameApi.programInstructionsIdentifierFunction(programNode.name);
    const discriminatorsFragment = mergeFragments(
        instructionsWithDiscriminators.map((instruction): Fragment => {
            const variant = nameApi.programInstructionsEnumVariant(instruction.name);
            return getDiscriminatorConditionFragment({
                ...scope,
                dataName: 'data',
                discriminators: instruction.discriminators ?? [],
                ifTrue: `return ${programInstructionsEnum}.${variant};`,
                struct: structTypeNodeFromInstructionArgumentNodes(instruction.arguments),
            });
        }),
        c => c.join('\n'),
    );

    return pipe(
        discriminatorsFragment,
        f =>
            mapFragmentContent(
                f,
                discriminators =>
                    `export function ${programInstructionsIdentifierFunction}(` +
                    `instruction: { data: ReadonlyUint8Array } | ReadonlyUint8Array` +
                    `): ${programInstructionsEnum} {\n` +
                    `const data = 'data' in instruction ? instruction.data : instruction;\n` +
                    `${discriminators}\n` +
                    `throw new Error("The provided instruction could not be identified as a ${programNode.name} instruction.")\n` +
                    `}`,
            ),
        f => addFragmentImports(f, 'solanaCodecsCore', ['type ReadonlyUint8Array']),
    );
}

function getProgramInstructionsParsedUnionTypeFragment(
    scope: Pick<RenderScope, 'nameApi'> & {
        allInstructions: InstructionNode[];
        programNode: ProgramNode;
    },
): Fragment {
    const { programNode, allInstructions, nameApi } = scope;

    const programAddress = programNode.publicKey;
    const programInstructionsType = nameApi.programInstructionsParsedUnionType(programNode.name);
    const programInstructionsEnum = nameApi.programInstructionsEnum(programNode.name);

    const typeVariants = allInstructions.map((instruction): Fragment => {
        const instructionEnumVariant = nameApi.programInstructionsEnumVariant(instruction.name);
        const parsedInstructionType = use(
            `type ${nameApi.instructionParsedType(instruction.name)}`,
            'generatedInstructions',
        );

        return fragment`| { instructionType: ${programInstructionsEnum}.${instructionEnumVariant} } & ${parsedInstructionType}<TProgram>`;
    });

    return mergeFragments(
        [
            fragment`export type ${programInstructionsType}<TProgram extends string = '${programAddress}'> =`,
            ...typeVariants,
        ],
        c => c.join('\n'),
    );
}
