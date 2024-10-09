import {
    getAllInstructionsWithSubs,
    InstructionNode,
    ProgramNode,
    structTypeNodeFromInstructionArgumentNodes,
} from '@codama/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, fragment, mergeFragments } from './common';
import { getDiscriminatorConditionFragment } from './discriminatorCondition';

export function getProgramInstructionsFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi' | 'renderParentInstructions' | 'typeManifestVisitor'> & {
        programNode: ProgramNode;
    },
): Fragment {
    if (scope.programNode.instructions.length === 0) return fragment('');
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
        r => `${r.join('\n\n')}\n`,
    );
}

function getProgramInstructionsEnumFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        allInstructions: InstructionNode[];
        programNode: ProgramNode;
    },
): Fragment {
    const { programNode, allInstructions, nameApi } = scope;
    const programInstructionsEnum = nameApi.programInstructionsEnum(programNode.name);
    const programInstructionsEnumVariants = allInstructions.map(instruction =>
        nameApi.programInstructionsEnumVariant(instruction.name),
    );
    return fragment(
        `export enum ${programInstructionsEnum} { ` + `${programInstructionsEnumVariants.join(', ')}` + ` }`,
    );
}

function getProgramInstructionsIdentifierFunctionFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi' | 'typeManifestVisitor'> & {
        allInstructions: InstructionNode[];
        programNode: ProgramNode;
    },
): Fragment {
    const { programNode, nameApi, allInstructions } = scope;
    const instructionsWithDiscriminators = allInstructions.filter(
        instruction => (instruction.discriminators ?? []).length > 0,
    );
    const hasInstructionDiscriminators = instructionsWithDiscriminators.length > 0;
    if (!hasInstructionDiscriminators) return fragment('');

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
        r => r.join('\n'),
    );

    return discriminatorsFragment
        .mapRender(
            discriminators =>
                `export function ${programInstructionsIdentifierFunction}(` +
                `instruction: { data: ReadonlyUint8Array } | ReadonlyUint8Array` +
                `): ${programInstructionsEnum} {\n` +
                `const data = 'data' in instruction ? instruction.data : instruction;\n` +
                `${discriminators}\n` +
                `throw new Error("The provided instruction could not be identified as a ${programNode.name} instruction.")\n` +
                `}`,
        )
        .addImports('solanaCodecsCore', 'type ReadonlyUint8Array');
}

function getProgramInstructionsParsedUnionTypeFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
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

        const parsedInstructionType = nameApi.instructionParsedType(instruction.name);

        return fragment(
            `| { instructionType: ${programInstructionsEnum}.${instructionEnumVariant} } & ${parsedInstructionType}<TProgram>`,
        ).addImports('generatedInstructions', `type ${parsedInstructionType}`);
    });

    return mergeFragments(
        [
            fragment(`export type ${programInstructionsType}<TProgram extends string = '${programAddress}'> =`),
            ...typeVariants,
        ],
        r => r.join('\n'),
    );
}
