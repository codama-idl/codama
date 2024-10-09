import {
    AccountValueNode,
    accountValueNode,
    ArgumentValueNode,
    argumentValueNode,
    CamelCaseString,
    InstructionAccountNode,
    InstructionArgumentNode,
    InstructionInputValueNode,
    InstructionNode,
    isNode,
} from '@codama/nodes';
import { deduplicateInstructionDependencies, ResolvedInstructionInput } from '@codama/visitors-core';

export function hasAsyncFunction(
    instructionNode: InstructionNode,
    resolvedInputs: ResolvedInstructionInput[],
    asyncResolvers: string[],
): boolean {
    const hasByteDeltasAsync = (instructionNode.byteDeltas ?? []).some(
        ({ value }) => isNode(value, 'resolverValueNode') && asyncResolvers.includes(value.name),
    );
    const hasRemainingAccountsAsync = (instructionNode.remainingAccounts ?? []).some(
        ({ value }) => isNode(value, 'resolverValueNode') && asyncResolvers.includes(value.name),
    );

    return hasAsyncDefaultValues(resolvedInputs, asyncResolvers) || hasByteDeltasAsync || hasRemainingAccountsAsync;
}

export function hasAsyncDefaultValues(resolvedInputs: ResolvedInstructionInput[], asyncResolvers: string[]): boolean {
    return resolvedInputs.some(
        input => !!input.defaultValue && isAsyncDefaultValue(input.defaultValue, asyncResolvers),
    );
}

export function isAsyncDefaultValue(defaultValue: InstructionInputValueNode, asyncResolvers: string[]): boolean {
    switch (defaultValue.kind) {
        case 'pdaValueNode':
            return true;
        case 'resolverValueNode':
            return asyncResolvers.includes(defaultValue.name);
        case 'conditionalValueNode':
            return (
                isAsyncDefaultValue(defaultValue.condition, asyncResolvers) ||
                (defaultValue.ifFalse == null ? false : isAsyncDefaultValue(defaultValue.ifFalse, asyncResolvers)) ||
                (defaultValue.ifTrue == null ? false : isAsyncDefaultValue(defaultValue.ifTrue, asyncResolvers))
            );
        default:
            return false;
    }
}

export function getInstructionDependencies(
    input: InstructionAccountNode | InstructionArgumentNode | InstructionNode,
    asyncResolvers: string[],
    useAsync: boolean,
): (AccountValueNode | ArgumentValueNode)[] {
    if (isNode(input, 'instructionNode')) {
        return deduplicateInstructionDependencies([
            ...input.accounts.flatMap(x => getInstructionDependencies(x, asyncResolvers, useAsync)),
            ...input.arguments.flatMap(x => getInstructionDependencies(x, asyncResolvers, useAsync)),
            ...(input.extraArguments ?? []).flatMap(x => getInstructionDependencies(x, asyncResolvers, useAsync)),
        ]);
    }

    if (!input.defaultValue) return [];

    const getNestedDependencies = (
        defaultValue: InstructionInputValueNode | undefined,
    ): (AccountValueNode | ArgumentValueNode)[] => {
        if (!defaultValue) return [];
        return getInstructionDependencies({ ...input, defaultValue }, asyncResolvers, useAsync);
    };

    if (isNode(input.defaultValue, ['accountValueNode', 'accountBumpValueNode'])) {
        return [accountValueNode(input.defaultValue.name)];
    }

    if (isNode(input.defaultValue, ['argumentValueNode'])) {
        return [argumentValueNode(input.defaultValue.name)];
    }

    if (isNode(input.defaultValue, 'pdaValueNode')) {
        const dependencies = new Map<CamelCaseString, AccountValueNode | ArgumentValueNode>();
        input.defaultValue.seeds.forEach(seed => {
            if (isNode(seed.value, ['accountValueNode', 'argumentValueNode'])) {
                dependencies.set(seed.value.name, { ...seed.value });
            }
        });
        return [...dependencies.values()];
    }

    if (isNode(input.defaultValue, 'resolverValueNode')) {
        const isSynchronousResolver = !asyncResolvers.includes(input.defaultValue.name);
        if (useAsync || isSynchronousResolver) {
            return input.defaultValue.dependsOn ?? [];
        }
    }

    if (isNode(input.defaultValue, 'conditionalValueNode')) {
        return deduplicateInstructionDependencies([
            ...getNestedDependencies(input.defaultValue.condition),
            ...getNestedDependencies(input.defaultValue.ifTrue),
            ...getNestedDependencies(input.defaultValue.ifFalse),
        ]);
    }

    return [];
}
