/* eslint-disable no-case-declarations */
import {
    AccountValueNode,
    accountValueNode,
    ArgumentValueNode,
    CamelCaseString,
    getAllInstructionArguments,
    InstructionAccountNode,
    InstructionArgumentNode,
    InstructionInputValueNode,
    InstructionNode,
    isNode,
    VALUE_NODES,
} from '@kinobi-so/nodes';
import { singleNodeVisitor, Visitor } from '@kinobi-so/visitors-core';

export type ResolvedInstructionInput = ResolvedInstructionAccount | ResolvedInstructionArgument;
export type ResolvedInstructionAccount = InstructionAccountNode & {
    dependsOn: InstructionDependency[];
    isPda: boolean;
    resolvedIsOptional: boolean;
    resolvedIsSigner: boolean | 'either';
};
export type ResolvedInstructionArgument = InstructionArgumentNode & {
    dependsOn: InstructionDependency[];
};
type InstructionInput = InstructionAccountNode | InstructionArgumentNode;
type InstructionDependency = AccountValueNode | ArgumentValueNode;

export function getResolvedInstructionInputsVisitor(
    options: { includeDataArgumentValueNodes?: boolean } = {},
): Visitor<ResolvedInstructionInput[], 'instructionNode'> {
    const includeDataArgumentValueNodes = options.includeDataArgumentValueNodes ?? false;
    let stack: InstructionInput[] = [];
    let resolved: ResolvedInstructionInput[] = [];
    let visitedAccounts = new Map<string, ResolvedInstructionAccount>();
    let visitedArgs = new Map<string, ResolvedInstructionArgument>();

    function resolveInstructionInput(instruction: InstructionNode, input: InstructionInput): void {
        // Ensure we don't visit the same input twice.
        if (
            (isNode(input, 'instructionAccountNode') && visitedAccounts.has(input.name)) ||
            (isNode(input, 'instructionArgumentNode') && visitedArgs.has(input.name))
        ) {
            return;
        }

        // Ensure we don't have a circular dependency.
        const isCircular = stack.some(({ kind, name }) => kind === input.kind && name === input.name);
        if (isCircular) {
            const cycle = [...stack.map(({ name }) => name), input.name].join(' -> ');
            const error =
                `Circular dependency detected in the accounts and args of ` +
                `the "${instruction.name}" instruction. ` +
                `Got the following dependency cycle: ${cycle}.`;
            throw new Error(error);
        }

        // Resolve whilst keeping track of the stack.
        stack.push(input);
        const localResolved =
            input.kind === 'instructionAccountNode'
                ? resolveInstructionAccount(instruction, input)
                : resolveInstructionArgument(instruction, input);
        stack.pop();

        // Store the resolved input.
        resolved.push(localResolved);
        if (localResolved.kind === 'instructionAccountNode') {
            visitedAccounts.set(input.name, localResolved);
        } else {
            visitedArgs.set(input.name, localResolved);
        }
    }

    function resolveInstructionAccount(
        instruction: InstructionNode,
        account: InstructionAccountNode,
    ): ResolvedInstructionAccount {
        // Find and visit dependencies first.
        const dependsOn = getInstructionDependencies(account);
        resolveInstructionDependencies(instruction, account, dependsOn);

        const localResolved: ResolvedInstructionAccount = {
            ...account,
            dependsOn,
            isPda: getAllInstructionArguments(instruction).some(
                argument =>
                    isNode(argument.defaultValue, 'accountBumpValueNode') &&
                    argument.defaultValue.name === account.name,
            ),
            resolvedIsOptional: account.isOptional,
            resolvedIsSigner: account.isSigner,
        };

        switch (localResolved.defaultValue?.kind) {
            case 'accountValueNode':
                const defaultAccount = visitedAccounts.get(localResolved.defaultValue.name)!;
                const resolvedIsPublicKey = account.isSigner === false && defaultAccount.isSigner === false;
                const resolvedIsSigner = account.isSigner === true && defaultAccount.isSigner === true;
                const resolvedIsOptionalSigner = !resolvedIsPublicKey && !resolvedIsSigner;
                localResolved.resolvedIsSigner = resolvedIsOptionalSigner ? 'either' : resolvedIsSigner;
                localResolved.resolvedIsOptional = defaultAccount.isOptional;
                break;
            case 'publicKeyValueNode':
            case 'programLinkNode':
            case 'programIdValueNode':
                localResolved.resolvedIsSigner = account.isSigner === false ? false : 'either';
                localResolved.resolvedIsOptional = false;
                break;
            case 'pdaValueNode':
                localResolved.resolvedIsSigner = account.isSigner === false ? false : 'either';
                localResolved.resolvedIsOptional = false;
                const { seeds } = localResolved.defaultValue;
                seeds.forEach(seed => {
                    if (!isNode(seed.value, 'accountValueNode')) return;
                    const dependency = visitedAccounts.get(seed.value.name)!;
                    if (dependency.resolvedIsOptional) {
                        const error =
                            `Cannot use optional account "${seed.value.name}" as the "${seed.name}" PDA seed ` +
                            `for the "${account.name}" account of the "${instruction.name}" instruction.`;
                        throw new Error(error);
                    }
                });
                break;
            case 'identityValueNode':
            case 'payerValueNode':
            case 'resolverValueNode':
                localResolved.resolvedIsOptional = false;
                break;
            default:
                break;
        }

        return localResolved;
    }

    function resolveInstructionArgument(
        instruction: InstructionNode,
        argument: InstructionArgumentNode,
    ): ResolvedInstructionArgument {
        // Find and visit dependencies first.
        const dependsOn = getInstructionDependencies(argument);
        resolveInstructionDependencies(instruction, argument, dependsOn);

        return { ...argument, dependsOn };
    }

    function resolveInstructionDependencies(
        instruction: InstructionNode,
        parent: InstructionInput,
        dependencies: InstructionDependency[],
    ): void {
        dependencies.forEach(dependency => {
            let input: InstructionInput | null = null;
            if (isNode(dependency, 'accountValueNode')) {
                const dependencyAccount = instruction.accounts.find(a => a.name === dependency.name);
                if (!dependencyAccount) {
                    const error =
                        `Account "${dependency.name}" is not a valid dependency of ${parent.kind} ` +
                        `"${parent.name}" in the "${instruction.name}" instruction.`;
                    throw new Error(error);
                }
                input = { ...dependencyAccount };
            } else if (isNode(dependency, 'argumentValueNode')) {
                const dependencyArgument = getAllInstructionArguments(instruction).find(
                    a => a.name === dependency.name,
                );
                if (!dependencyArgument) {
                    const error =
                        `Argument "${dependency.name}" is not a valid dependency of ${parent.kind} ` +
                        `"${parent.name}" in the "${instruction.name}" instruction.`;
                    throw new Error(error);
                }
                input = { ...dependencyArgument };
            }
            if (input) {
                resolveInstructionInput(instruction, input);
            }
        });
    }

    function getInstructionDependencies(input: InstructionInput): InstructionDependency[] {
        if (!input.defaultValue) return [];

        const getNestedDependencies = (
            defaultValue: InstructionInputValueNode | undefined,
        ): InstructionDependency[] => {
            if (!defaultValue) return [];
            return getInstructionDependencies({ ...input, defaultValue });
        };

        if (isNode(input.defaultValue, ['accountValueNode', 'accountBumpValueNode'])) {
            return [accountValueNode(input.defaultValue.name)];
        }

        if (isNode(input.defaultValue, 'pdaValueNode')) {
            const dependencies = new Map<CamelCaseString, InstructionDependency>();
            input.defaultValue.seeds.forEach(seed => {
                if (isNode(seed.value, ['accountValueNode', 'argumentValueNode'])) {
                    dependencies.set(seed.value.name, { ...seed.value });
                }
            });
            return [...dependencies.values()];
        }

        if (isNode(input.defaultValue, 'resolverValueNode')) {
            return input.defaultValue.dependsOn ?? [];
        }

        if (isNode(input.defaultValue, 'conditionalValueNode')) {
            return [
                ...getNestedDependencies(input.defaultValue.condition),
                ...getNestedDependencies(input.defaultValue.ifTrue),
                ...getNestedDependencies(input.defaultValue.ifFalse),
            ];
        }

        return [];
    }

    return singleNodeVisitor('instructionNode', (node): ResolvedInstructionInput[] => {
        // Ensure we always start with a clean slate.
        stack = [];
        resolved = [];
        visitedAccounts = new Map();
        visitedArgs = new Map();

        const inputs: InstructionInput[] = [
            ...node.accounts,
            ...node.arguments.filter(a => {
                if (includeDataArgumentValueNodes) return a.defaultValue;
                return a.defaultValue && !isNode(a.defaultValue, VALUE_NODES);
            }),
            ...(node.extraArguments ?? []).filter(a => a.defaultValue),
        ];

        // Visit all instruction accounts.
        inputs.forEach(input => {
            resolveInstructionInput(node, input);
        });

        return resolved;
    });
}
