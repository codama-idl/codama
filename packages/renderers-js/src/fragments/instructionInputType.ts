import {
    camelCase,
    getAllInstructionArguments,
    InstructionArgumentNode,
    InstructionNode,
    isNode,
    parseDocs,
    pascalCase,
} from '@codama/nodes';
import { mapFragmentContent } from '@codama/renderers-core';
import {
    getLastNodeFromPath,
    NodePath,
    pipe,
    ResolvedInstructionAccount,
    ResolvedInstructionArgument,
    ResolvedInstructionInput,
} from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import {
    addFragmentImports,
    Fragment,
    fragment,
    fragmentFromTemplate,
    isAsyncDefaultValue,
    jsDocblock,
    mergeFragmentImports,
    mergeFragments,
} from '../utils';

export function getInstructionInputTypeFragment(
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'customInstructionData' | 'nameApi'> & {
        dataArgsManifest: TypeManifest;
        instructionPath: NodePath<InstructionNode>;
        renamedArgs: Map<string, string>;
        resolvedInputs: ResolvedInstructionInput[];
        useAsync: boolean;
    },
): Fragment {
    const { instructionPath, useAsync, nameApi } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);

    const instructionInputType = useAsync
        ? nameApi.instructionAsyncInputType(instructionNode.name)
        : nameApi.instructionSyncInputType(instructionNode.name);
    const accountsFragment = getAccountsFragment(scope);
    const [dataArgumentsFragment, customDataArgumentsFragment] = getDataArgumentsFragments(scope);
    const extraArgumentsFragment = getExtraArgumentsFragment(scope);
    const remainingAccountsFragment = getRemainingAccountsFragment(instructionNode);

    return pipe(
        fragmentFromTemplate('instructionInputType.njk', {
            accountsFragment: accountsFragment.content,
            customDataArgumentsFragment: customDataArgumentsFragment.content,
            dataArgumentsFragment: dataArgumentsFragment.content,
            extraArgumentsFragment: extraArgumentsFragment.content,
            instruction: instructionNode,
            instructionInputType,
            remainingAccountsFragment: remainingAccountsFragment.content,
        }),
        f =>
            mergeFragmentImports(f, [
                accountsFragment.imports,
                dataArgumentsFragment.imports,
                customDataArgumentsFragment.imports,
                extraArgumentsFragment.imports,
                remainingAccountsFragment.imports,
            ]),
        f => addFragmentImports(f, 'solanaAddresses', ['type Address']),
    );
}

function getAccountsFragment(
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'customInstructionData' | 'nameApi'> & {
        instructionPath: NodePath<InstructionNode>;
        resolvedInputs: ResolvedInstructionInput[];
        useAsync: boolean;
    },
): Fragment {
    const { instructionPath, resolvedInputs, useAsync, asyncResolvers } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);

    const fragments = instructionNode.accounts.map(account => {
        const resolvedAccount = resolvedInputs.find(
            input => input.kind === 'instructionAccountNode' && input.name === account.name,
        ) as ResolvedInstructionAccount;
        const hasDefaultValue =
            !!resolvedAccount.defaultValue &&
            !isNode(resolvedAccount.defaultValue, ['identityValueNode', 'payerValueNode']) &&
            (useAsync || !isAsyncDefaultValue(resolvedAccount.defaultValue, asyncResolvers));
        const accountDocs = parseDocs(account.docs);
        const docblock = accountDocs.length > 0 ? jsDocblock(accountDocs) : '';
        const optionalSign = hasDefaultValue || resolvedAccount.isOptional ? '?' : '';
        return mapFragmentContent(
            getAccountTypeFragment(resolvedAccount),
            c => `${docblock}${camelCase(account.name)}${optionalSign}: ${c};`,
        );
    });

    return mergeFragments(fragments, c => c.join('\n'));
}

function getAccountTypeFragment(account: Pick<ResolvedInstructionAccount, 'isPda' | 'isSigner' | 'name'>): Fragment {
    const typeParam = `TAccount${pascalCase(account.name)}`;

    if (account.isPda && account.isSigner === false) {
        return pipe(fragment(`ProgramDerivedAddress<${typeParam}>`), f =>
            addFragmentImports(f, 'solanaAddresses', ['type ProgramDerivedAddress']),
        );
    }

    if (account.isPda && account.isSigner === 'either') {
        return pipe(
            fragment(`ProgramDerivedAddress<${typeParam}> | TransactionSigner<${typeParam}>`),
            f => addFragmentImports(f, 'solanaAddresses', ['type ProgramDerivedAddress']),
            f => addFragmentImports(f, 'solanaSigners', ['type TransactionSigner']),
        );
    }

    if (account.isSigner === 'either') {
        return pipe(
            fragment(`Address<${typeParam}> | TransactionSigner<${typeParam}>`),
            f => addFragmentImports(f, 'solanaAddresses', ['type Address']),
            f => addFragmentImports(f, 'solanaSigners', ['type TransactionSigner']),
        );
    }

    if (account.isSigner) {
        return pipe(fragment(`TransactionSigner<${typeParam}>`), f =>
            addFragmentImports(f, 'solanaSigners', ['type TransactionSigner']),
        );
    }

    return pipe(fragment(`Address<${typeParam}>`), f => addFragmentImports(f, 'solanaAddresses', ['type Address']));
}

function getDataArgumentsFragments(
    scope: Pick<GlobalFragmentScope, 'customInstructionData' | 'nameApi'> & {
        dataArgsManifest: TypeManifest;
        instructionPath: NodePath<InstructionNode>;
        renamedArgs: Map<string, string>;
        resolvedInputs: ResolvedInstructionInput[];
    },
): [Fragment, Fragment] {
    const { instructionPath, nameApi } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);

    const customData = scope.customInstructionData.get(instructionNode.name);
    if (customData) {
        return [
            fragment(''),
            pipe(
                fragment(nameApi.dataArgsType(customData.importAs)),
                f => mergeFragmentImports(f, [scope.dataArgsManifest.looseType.imports]),
                f => mapFragmentContent(f, c => `${c} & `),
            ),
        ];
    }

    const instructionDataName = nameApi.instructionDataType(instructionNode.name);
    const dataArgsType = nameApi.dataArgsType(instructionDataName);

    const fragments = instructionNode.arguments.flatMap(arg => {
        const argFragment = getArgumentFragment(arg, fragment(dataArgsType), scope.resolvedInputs, scope.renamedArgs);
        return argFragment ? [argFragment] : [];
    });

    return [mergeFragments(fragments, c => c.join('\n')), fragment('')];
}

function getExtraArgumentsFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        instructionPath: NodePath<InstructionNode>;
        renamedArgs: Map<string, string>;
        resolvedInputs: ResolvedInstructionInput[];
    },
): Fragment {
    const { instructionPath, nameApi } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);
    const instructionExtraName = nameApi.instructionExtraType(instructionNode.name);
    const extraArgsType = nameApi.dataArgsType(instructionExtraName);

    const fragments = (instructionNode.extraArguments ?? []).flatMap(arg => {
        const argFragment = getArgumentFragment(arg, fragment(extraArgsType), scope.resolvedInputs, scope.renamedArgs);
        return argFragment ? [argFragment] : [];
    });

    return mergeFragments(fragments, c => c.join('\n'));
}

function getArgumentFragment(
    arg: InstructionArgumentNode,
    argsType: Fragment,
    resolvedInputs: ResolvedInstructionInput[],
    renamedArgs: Map<string, string>,
): Fragment | null {
    const resolvedArg = resolvedInputs.find(
        input => isNode(input, 'instructionArgumentNode') && input.name === arg.name,
    ) as ResolvedInstructionArgument | undefined;
    if (arg.defaultValue && arg.defaultValueStrategy === 'omitted') return null;
    const renamedName = renamedArgs.get(arg.name) ?? arg.name;
    const optionalSign = arg.defaultValue || resolvedArg?.defaultValue ? '?' : '';
    return mapFragmentContent(
        argsType,
        c => `${camelCase(renamedName)}${optionalSign}: ${c}["${camelCase(arg.name)}"];`,
    );
}

function getRemainingAccountsFragment(instructionNode: InstructionNode): Fragment {
    const fragments = (instructionNode.remainingAccounts ?? []).flatMap(remainingAccountsNode => {
        if (isNode(remainingAccountsNode.value, 'resolverValueNode')) return [];

        const { name } = remainingAccountsNode.value;
        const allArguments = getAllInstructionArguments(instructionNode);
        const argumentExists = allArguments.some(arg => arg.name === name);
        if (argumentExists) return [];

        const isSigner = remainingAccountsNode.isSigner ?? false;
        const optionalSign = (remainingAccountsNode.isOptional ?? false) ? '?' : '';
        const signerFragment = pipe(fragment(`TransactionSigner`), f =>
            addFragmentImports(f, 'solanaSigners', ['type TransactionSigner']),
        );
        const addressFragment = pipe(fragment(`Address`), f =>
            addFragmentImports(f, 'solanaAddresses', ['type Address']),
        );
        return mapFragmentContent(
            (() => {
                if (isSigner === 'either') {
                    return mergeFragments([signerFragment, addressFragment], c => c.join(' | '));
                }
                return isSigner ? signerFragment : addressFragment;
            })(),
            c => `${camelCase(name)}${optionalSign}: Array<${c}>;`,
        );
    });

    return mergeFragments(fragments, c => c.join('\n'));
}
