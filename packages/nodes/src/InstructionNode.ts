import type {
    DiscriminatorNode,
    InstructionAccountNode,
    InstructionArgumentNode,
    InstructionByteDeltaNode,
    InstructionNode,
    InstructionRemainingAccountsNode,
    OptionalAccountStrategy,
    ProgramNode,
    RootNode,
} from '@codama/node-types';

import { isNode } from './Node';
import { getAllInstructions } from './ProgramNode';
import { camelCase, DocsInput, parseDocs } from './shared';

type SubInstructionNode = InstructionNode;

export type InstructionNodeInput<
    TAccounts extends InstructionAccountNode[] = InstructionAccountNode[],
    TArguments extends InstructionArgumentNode[] = InstructionArgumentNode[],
    TExtraArguments extends InstructionArgumentNode[] | undefined = InstructionArgumentNode[] | undefined,
    TRemainingAccounts extends InstructionRemainingAccountsNode[] | undefined =
        | InstructionRemainingAccountsNode[]
        | undefined,
    TByteDeltas extends InstructionByteDeltaNode[] | undefined = InstructionByteDeltaNode[] | undefined,
    TDiscriminators extends DiscriminatorNode[] | undefined = DiscriminatorNode[] | undefined,
    TSubInstructions extends SubInstructionNode[] | undefined = SubInstructionNode[] | undefined,
> = Omit<
    Partial<
        InstructionNode<
            TAccounts,
            TArguments,
            TExtraArguments,
            TRemainingAccounts,
            TByteDeltas,
            TDiscriminators,
            TSubInstructions
        >
    >,
    'docs' | 'kind' | 'name'
> & {
    readonly docs?: DocsInput;
    readonly name: string;
};

export function instructionNode<
    const TAccounts extends InstructionAccountNode[] = [],
    const TArguments extends InstructionArgumentNode[] = [],
    const TExtraArguments extends InstructionArgumentNode[] | undefined = undefined,
    const TRemainingAccounts extends InstructionRemainingAccountsNode[] | undefined = undefined,
    const TByteDeltas extends InstructionByteDeltaNode[] | undefined = undefined,
    const TDiscriminators extends DiscriminatorNode[] | undefined = undefined,
    const TSubInstructions extends SubInstructionNode[] | undefined = undefined,
>(
    input: InstructionNodeInput<
        TAccounts,
        TArguments,
        TExtraArguments,
        TRemainingAccounts,
        TByteDeltas,
        TDiscriminators,
        TSubInstructions
    >,
): InstructionNode<
    TAccounts,
    TArguments,
    TExtraArguments,
    TRemainingAccounts,
    TByteDeltas,
    TDiscriminators,
    TSubInstructions
> {
    return Object.freeze({
        kind: 'instructionNode',

        // Data.
        name: camelCase(input.name),
        docs: parseDocs(input.docs),
        optionalAccountStrategy: parseOptionalAccountStrategy(input.optionalAccountStrategy),
        ...(input.status !== undefined && { status: input.status }),

        // Children.
        accounts: (input.accounts ?? []) as TAccounts,
        arguments: (input.arguments ?? []) as TArguments,
        extraArguments: input.extraArguments,
        remainingAccounts: input.remainingAccounts,
        byteDeltas: input.byteDeltas,
        discriminators: input.discriminators,
        subInstructions: input.subInstructions,
    });
}

export function parseOptionalAccountStrategy(
    optionalAccountStrategy: OptionalAccountStrategy | undefined,
): OptionalAccountStrategy {
    return optionalAccountStrategy ?? 'programId';
}

export function getAllInstructionArguments(node: InstructionNode): InstructionArgumentNode[] {
    return [...node.arguments, ...(node.extraArguments ?? [])];
}

export function getAllInstructionsWithSubs(
    node: InstructionNode | ProgramNode | RootNode,
    config: { leavesOnly?: boolean; subInstructionsFirst?: boolean } = {},
): InstructionNode[] {
    const { leavesOnly = false, subInstructionsFirst = false } = config;
    if (isNode(node, 'instructionNode')) {
        if (!node.subInstructions || node.subInstructions.length === 0) return [node];
        const subInstructions = node.subInstructions.flatMap(sub => getAllInstructionsWithSubs(sub, config));
        if (leavesOnly) return subInstructions;
        return subInstructionsFirst ? [...subInstructions, node] : [node, ...subInstructions];
    }

    const instructions = isNode(node, 'programNode') ? node.instructions : getAllInstructions(node);

    return instructions.flatMap(instruction => getAllInstructionsWithSubs(instruction, config));
}
