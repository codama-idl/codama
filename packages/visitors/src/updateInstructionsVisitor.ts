import {
    assertIsNode,
    InstructionAccountNode,
    instructionAccountNode,
    InstructionAccountNodeInput,
    InstructionArgumentNode,
    instructionArgumentNode,
    InstructionArgumentNodeInput,
    InstructionInputValueNode,
    InstructionNode,
    instructionNode,
    InstructionNodeInput,
    TYPE_NODES,
} from '@codama/nodes';
import {
    BottomUpNodeTransformerWithSelector,
    bottomUpTransformerVisitor,
    LinkableDictionary,
    NodePath,
    NodeStack,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    recordNodeStackVisitor,
    visit,
} from '@codama/visitors-core';

import { fillDefaultPdaSeedValuesVisitor } from './fillDefaultPdaSeedValuesVisitor';

export type InstructionUpdates =
    | { delete: true }
    | (InstructionMetadataUpdates & {
          accounts?: InstructionAccountUpdates;
          arguments?: InstructionArgumentUpdates;
      });

export type InstructionMetadataUpdates = Partial<
    Omit<
        InstructionNodeInput,
        | 'accounts'
        | 'arguments'
        | 'byteDeltas'
        | 'discriminators'
        | 'extraArguments'
        | 'remainingAccounts'
        | 'subInstructions'
    >
>;

export type InstructionAccountUpdates = Record<
    string,
    Partial<Omit<InstructionAccountNodeInput, 'defaultValue'>> & {
        defaultValue?: InstructionInputValueNode | null;
    }
>;

export type InstructionArgumentUpdates = Record<
    string,
    Partial<Omit<InstructionArgumentNodeInput, 'defaultValue'>> & {
        defaultValue?: InstructionInputValueNode | null;
    }
>;

export function updateInstructionsVisitor(map: Record<string, InstructionUpdates>) {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();

    const transformers = Object.entries(map).map(
        ([selector, updates]): BottomUpNodeTransformerWithSelector => ({
            select: ['[instructionNode]', selector],
            transform: node => {
                assertIsNode(node, 'instructionNode');
                if ('delete' in updates) {
                    return null;
                }

                const instructionPath = stack.getPath('instructionNode');
                const { accounts: accountUpdates, arguments: argumentUpdates, ...metadataUpdates } = updates;
                const { newArguments, newExtraArguments } = handleInstructionArguments(node, argumentUpdates ?? {});
                const newAccounts = node.accounts.map(account =>
                    handleInstructionAccount(instructionPath, account, accountUpdates ?? {}, linkables),
                );
                return instructionNode({
                    ...node,
                    ...metadataUpdates,
                    accounts: newAccounts,
                    arguments: newArguments,
                    extraArguments: newExtraArguments.length > 0 ? newExtraArguments : undefined,
                });
            },
        }),
    );

    return pipe(
        bottomUpTransformerVisitor(transformers),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}

function handleInstructionAccount(
    instructionPath: NodePath<InstructionNode>,
    account: InstructionAccountNode,
    accountUpdates: InstructionAccountUpdates,
    linkables: LinkableDictionary,
): InstructionAccountNode {
    const accountUpdate = accountUpdates?.[account.name];
    if (!accountUpdate) return account;
    const { defaultValue, ...acountWithoutDefault } = {
        ...account,
        ...accountUpdate,
    };

    if (!defaultValue) {
        return instructionAccountNode(acountWithoutDefault);
    }

    return instructionAccountNode({
        ...acountWithoutDefault,
        defaultValue: visit(defaultValue, fillDefaultPdaSeedValuesVisitor(instructionPath, linkables)),
    });
}

function handleInstructionArguments(
    instruction: InstructionNode,
    argUpdates: InstructionArgumentUpdates,
): {
    newArguments: InstructionArgumentNode[];
    newExtraArguments: InstructionArgumentNode[];
} {
    const usedArguments = new Set<string>();

    const newArguments = instruction.arguments.map(node => {
        const argUpdate = argUpdates[node.name];
        if (!argUpdate) return node;
        usedArguments.add(node.name);
        return instructionArgumentNode({
            ...node,
            defaultValue: argUpdate.defaultValue ?? node.defaultValue,
            defaultValueStrategy: argUpdate.defaultValueStrategy ?? node.defaultValueStrategy,
            docs: argUpdate.docs ?? node.docs,
            name: argUpdate.name ?? node.name,
            type: argUpdate.type ?? node.type,
        });
    });

    const updatedExtraArguments = (instruction.extraArguments ?? []).map(node => {
        if (usedArguments.has(node.name)) return node;
        const argUpdate = argUpdates[node.name];
        if (!argUpdate) return node;
        usedArguments.add(node.name);
        return instructionArgumentNode({
            ...node,
            defaultValue: argUpdate.defaultValue ?? node.defaultValue,
            defaultValueStrategy: argUpdate.defaultValueStrategy ?? node.defaultValueStrategy,
            docs: argUpdate.docs ?? node.docs,
            name: argUpdate.name ?? node.name,
            type: argUpdate.type ?? node.type,
        });
    });

    const newExtraArguments = [
        ...updatedExtraArguments,
        ...Object.entries(argUpdates)
            .filter(([argName]) => !usedArguments.has(argName))
            .map(([argName, argUpdate]) => {
                const { type } = argUpdate;
                assertIsNode(type, TYPE_NODES);
                return instructionArgumentNode({
                    defaultValue: argUpdate.defaultValue ?? undefined,
                    defaultValueStrategy: argUpdate.defaultValueStrategy ?? undefined,
                    docs: argUpdate.docs ?? [],
                    name: argUpdate.name ?? argName,
                    type,
                });
            }),
    ];

    return { newArguments, newExtraArguments };
}
