import {
    camelCase,
    getAllInstructionArguments,
    InstructionArgumentNode,
    InstructionNode,
    isNode,
    pascalCase,
} from '@kinobi-so/nodes';
import {
    ResolvedInstructionAccount,
    ResolvedInstructionArgument,
    ResolvedInstructionInput,
} from '@kinobi-so/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { isAsyncDefaultValue, jsDocblock } from '../utils';
import { Fragment, fragment, fragmentFromTemplate, mergeFragments } from './common';

export function getInstructionInputTypeFragment(
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'customInstructionData' | 'nameApi'> & {
        dataArgsManifest: TypeManifest;
        instructionNode: InstructionNode;
        renamedArgs: Map<string, string>;
        resolvedInputs: ResolvedInstructionInput[];
        useAsync: boolean;
    },
): Fragment {
    const { instructionNode, useAsync, nameApi } = scope;

    const instructionInputType = useAsync
        ? nameApi.instructionAsyncInputType(instructionNode.name)
        : nameApi.instructionSyncInputType(instructionNode.name);
    const accountsFragment = getAccountsFragment(scope);
    const [dataArgumentsFragment, customDataArgumentsFragment] = getDataArgumentsFragments(scope);
    const extraArgumentsFragment = getExtraArgumentsFragment(scope);
    const remainingAccountsFragment = getRemainingAccountsFragment(instructionNode);

    return fragmentFromTemplate('instructionInputType.njk', {
        accountsFragment,
        customDataArgumentsFragment,
        dataArgumentsFragment,
        extraArgumentsFragment,
        instruction: instructionNode,
        instructionInputType,
        remainingAccountsFragment,
    })
        .mergeImportsWith(
            accountsFragment,
            dataArgumentsFragment,
            customDataArgumentsFragment,
            extraArgumentsFragment,
            remainingAccountsFragment,
        )
        .addImports('solanaAddresses', ['type Address']);
}

function getAccountsFragment(
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'customInstructionData' | 'nameApi'> & {
        instructionNode: InstructionNode;
        resolvedInputs: ResolvedInstructionInput[];
        useAsync: boolean;
    },
): Fragment {
    const { instructionNode, resolvedInputs, useAsync, asyncResolvers } = scope;

    const fragments = instructionNode.accounts.map(account => {
        const resolvedAccount = resolvedInputs.find(
            input => input.kind === 'instructionAccountNode' && input.name === account.name,
        ) as ResolvedInstructionAccount;
        const hasDefaultValue =
            !!resolvedAccount.defaultValue &&
            !isNode(resolvedAccount.defaultValue, ['identityValueNode', 'payerValueNode']) &&
            (useAsync || !isAsyncDefaultValue(resolvedAccount.defaultValue, asyncResolvers));
        const docblock = account.docs.length > 0 ? jsDocblock(account.docs) : '';
        const optionalSign = hasDefaultValue || resolvedAccount.isOptional ? '?' : '';
        return getAccountTypeFragment(resolvedAccount).mapRender(
            r => `${docblock}${camelCase(account.name)}${optionalSign}: ${r};`,
        );
    });

    return mergeFragments(fragments, r => r.join('\n'));
}

function getAccountTypeFragment(account: Pick<ResolvedInstructionAccount, 'isPda' | 'isSigner' | 'name'>): Fragment {
    const typeParam = `TAccount${pascalCase(account.name)}`;

    if (account.isPda && account.isSigner === false) {
        return fragment(`ProgramDerivedAddress<${typeParam}>`).addImports('solanaAddresses', [
            'type ProgramDerivedAddress',
        ]);
    }

    if (account.isPda && account.isSigner === 'either') {
        return fragment(`ProgramDerivedAddress<${typeParam}> | TransactionSigner<${typeParam}>`)
            .addImports('solanaAddresses', ['type ProgramDerivedAddress'])
            .addImports('solanaSigners', ['type TransactionSigner']);
    }

    if (account.isSigner === 'either') {
        return fragment(`Address<${typeParam}> | TransactionSigner<${typeParam}>`)
            .addImports('solanaAddresses', ['type Address'])
            .addImports('solanaSigners', ['type TransactionSigner']);
    }

    if (account.isSigner) {
        return fragment(`TransactionSigner<${typeParam}>`).addImports('solanaSigners', ['type TransactionSigner']);
    }

    return fragment(`Address<${typeParam}>`).addImports('solanaAddresses', ['type Address']);
}

function getDataArgumentsFragments(
    scope: Pick<GlobalFragmentScope, 'customInstructionData' | 'nameApi'> & {
        dataArgsManifest: TypeManifest;
        instructionNode: InstructionNode;
        renamedArgs: Map<string, string>;
        resolvedInputs: ResolvedInstructionInput[];
    },
): [Fragment, Fragment] {
    const { instructionNode, nameApi } = scope;

    const customData = scope.customInstructionData.get(instructionNode.name);
    if (customData) {
        return [
            fragment(''),
            fragment(nameApi.dataArgsType(customData.importAs))
                .mergeImportsWith(scope.dataArgsManifest.looseType)
                .mapRender(r => `${r} & `),
        ];
    }

    const instructionDataName = nameApi.instructionDataType(instructionNode.name);
    const dataArgsType = nameApi.dataArgsType(instructionDataName);

    const fragments = instructionNode.arguments.flatMap(arg => {
        const argFragment = getArgumentFragment(arg, fragment(dataArgsType), scope.resolvedInputs, scope.renamedArgs);
        return argFragment ? [argFragment] : [];
    });

    return [mergeFragments(fragments, r => r.join('\n')), fragment('')];
}

function getExtraArgumentsFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        instructionNode: InstructionNode;
        renamedArgs: Map<string, string>;
        resolvedInputs: ResolvedInstructionInput[];
    },
): Fragment {
    const { instructionNode, nameApi } = scope;
    const instructionExtraName = nameApi.instructionExtraType(instructionNode.name);
    const extraArgsType = nameApi.dataArgsType(instructionExtraName);

    const fragments = (instructionNode.extraArguments ?? []).flatMap(arg => {
        const argFragment = getArgumentFragment(arg, fragment(extraArgsType), scope.resolvedInputs, scope.renamedArgs);
        return argFragment ? [argFragment] : [];
    });

    return mergeFragments(fragments, r => r.join('\n'));
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
    return argsType.mapRender(r => `${camelCase(renamedName)}${optionalSign}: ${r}["${camelCase(arg.name)}"];`);
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
        const signerFragment = fragment(`TransactionSigner`).addImports('solanaSigners', ['type TransactionSigner']);
        const addressFragment = fragment(`Address`).addImports('solanaAddresses', ['type Address']);
        return (() => {
            if (isSigner === 'either') {
                return mergeFragments([signerFragment, addressFragment], r => r.join(' | '));
            }
            return isSigner ? signerFragment : addressFragment;
        })().mapRender(r => `${camelCase(name)}${optionalSign}: Array<${r}>;`);
    });

    return mergeFragments(fragments, r => r.join('\n'));
}
