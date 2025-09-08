import { camelCase, InstructionArgumentNode, InstructionNode, isNode, isNodeFilter, pascalCase } from '@codama/nodes';
import { mapFragmentContent } from '@codama/renderers-core';
import {
    findProgramNodeFromPath,
    getLastNodeFromPath,
    NodePath,
    pipe,
    ResolvedInstructionInput,
} from '@codama/visitors-core';

import {
    addFragmentImports,
    Fragment,
    fragment,
    getInstructionDependencies,
    hasAsyncFunction,
    isAsyncDefaultValue,
    mergeFragments,
    RenderScope,
    TypeManifest,
    use,
} from '../utils';
import { NameApi } from '../utils/nameTransformers';
import { getInstructionByteDeltaFragment } from './instructionByteDelta';
import { getInstructionInputResolvedFragment } from './instructionInputResolved';
import { getInstructionInputTypeFragment } from './instructionInputType';
import { getInstructionRemainingAccountsFragment } from './instructionRemainingAccounts';

export function getInstructionFunctionFragment(
    scope: Pick<
        RenderScope,
        'asyncResolvers' | 'customInstructionData' | 'getImportFrom' | 'nameApi' | 'typeManifestVisitor'
    > & {
        dataArgsManifest: TypeManifest;
        extraArgsManifest: TypeManifest;
        instructionPath: NodePath<InstructionNode>;
        renamedArgs: Map<string, string>;
        resolvedInputs: ResolvedInstructionInput[];
        useAsync: boolean;
    },
): Fragment | undefined {
    const { useAsync, instructionPath, resolvedInputs, renamedArgs, asyncResolvers, nameApi, customInstructionData } =
        scope;
    const instructionNode = getLastNodeFromPath(instructionPath);
    const programNode = findProgramNodeFromPath(instructionPath)!;
    if (useAsync && !hasAsyncFunction(instructionNode, resolvedInputs, asyncResolvers)) return;

    const customData = customInstructionData.get(instructionNode.name);
    const hasAccounts = instructionNode.accounts.length > 0;
    const instructionDependencies = getInstructionDependencies(instructionNode, asyncResolvers, useAsync);
    const argDependencies = instructionDependencies.filter(isNodeFilter('argumentValueNode')).map(node => node.name);
    const hasData = !!customData || instructionNode.arguments.length > 0;
    const argIsNotOmitted = (arg: InstructionArgumentNode) =>
        !(arg.defaultValue && arg.defaultValueStrategy === 'omitted');
    const argIsDependent = (arg: InstructionArgumentNode) => argDependencies.includes(arg.name);
    const argHasDefaultValue = (arg: InstructionArgumentNode) => {
        if (!arg.defaultValue) return false;
        if (useAsync) return true;
        return !isAsyncDefaultValue(arg.defaultValue, asyncResolvers);
    };
    const hasDataArgs = !!customData || instructionNode.arguments.filter(argIsNotOmitted).length > 0;
    const hasExtraArgs =
        (instructionNode.extraArguments ?? []).filter(
            field => argIsNotOmitted(field) && (argIsDependent(field) || argHasDefaultValue(field)),
        ).length > 0;
    const hasRemainingAccountArgs =
        (instructionNode.remainingAccounts ?? []).filter(({ value }) => isNode(value, 'argumentValueNode')).length > 0;
    const hasAnyArgs = hasDataArgs || hasExtraArgs || hasRemainingAccountArgs;
    const hasInput = hasAccounts || hasAnyArgs;
    const programAddressConstant = use(nameApi.programAddressConstant(programNode.name), 'generatedPrograms');

    const functionName = useAsync
        ? nameApi.instructionAsyncFunction(instructionNode.name)
        : nameApi.instructionSyncFunction(instructionNode.name);

    // Input.
    const resolvedInputsFragment = getInstructionInputResolvedFragment(scope);
    const remainingAccountsFragment = getInstructionRemainingAccountsFragment(scope);
    const byteDeltaFragment = getInstructionByteDeltaFragment(scope);
    const resolvedInputFragment = mergeFragments(
        [resolvedInputsFragment, remainingAccountsFragment, byteDeltaFragment],
        content => content.join('\n\n'),
    );
    const hasRemainingAccounts = !!remainingAccountsFragment;
    const hasByteDeltas = !!byteDeltaFragment;
    const hasResolver = resolvedInputFragment.features.has('instruction:resolverScopeVariable');
    const instructionTypeFragment = getInstructionTypeFragment(scope);

    const typeParams = getTypeParamsFragment(instructionNode, programAddressConstant);
    const returnType = getReturnTypeFragment(instructionTypeFragment, hasByteDeltas, useAsync);
    const inputType = getInstructionInputTypeFragment(scope);
    const inputArg = mapFragmentContent(getInputTypeCallFragment(scope), c => (hasInput ? `input: ${c}, ` : ''));
    const functionBody = mergeFragments(
        [
            getProgramAddressInitializationFragment(programAddressConstant),
            getAccountsInitializationFragment(instructionNode),
            getArgumentsInitializationFragment(hasAnyArgs, renamedArgs),
            getResolverScopeInitializationFragment(hasResolver, hasAccounts, hasAnyArgs),
            resolvedInputFragment,
            getReturnStatementFragment({
                ...scope,
                hasByteDeltas,
                hasData,
                hasDataArgs,
                hasRemainingAccounts,
                instructionNode,
                syncReturnTypeFragment: getReturnTypeFragment(instructionTypeFragment, hasByteDeltas, false),
            }),
        ],
        cs => cs.join('\n\n'),
    );

    return fragment`${inputType}\n\nexport ${useAsync ? 'async ' : ''}function ${functionName}${typeParams}(${inputArg}config?: { programAddress?: TProgramAddress } ): ${returnType} {
  ${functionBody}
}`;
}

function getProgramAddressInitializationFragment(programAddressConstant: Fragment): Fragment {
    return fragment`// Program address.
const programAddress = config?.programAddress ?? ${programAddressConstant};`;
}

function getAccountsInitializationFragment(instructionNode: InstructionNode): Fragment | undefined {
    if (instructionNode.accounts.length === 0) return;

    const accounts = mergeFragments(
        instructionNode.accounts.map(account => {
            const name = camelCase(account.name);
            const isWritable = account.isWritable ? 'true' : 'false';
            return fragment`${name}: { value: input.${name} ?? null, isWritable: ${isWritable} }`;
        }),
        cs => cs.join(', '),
    );

    return fragment` // Original accounts.
const originalAccounts = { ${accounts} }
const accounts = originalAccounts as Record<keyof typeof originalAccounts, ${use('type ResolvedAccount', 'shared')}>;
`;
}

function getArgumentsInitializationFragment(
    hasAnyArgs: boolean,
    renamedArgs: Map<string, string>,
): Fragment | undefined {
    if (!hasAnyArgs) return;
    const renamedArgsText = [...renamedArgs.entries()].map(([k, v]) => `${k}: input.${v}`).join(', ');

    return fragment`// Original args.
const args = { ...input, ${renamedArgsText} };
`;
}

function getResolverScopeInitializationFragment(
    hasResolver: boolean,
    hasAccounts: boolean,
    hasAnyArgs: boolean,
): Fragment | undefined {
    if (!hasResolver) return;

    const resolverAttributes = [
        'programAddress',
        ...(hasAccounts ? ['accounts'] : []),
        ...(hasAnyArgs ? ['args'] : []),
    ].join(', ');

    return fragment`// Resolver scope.
const resolverScope = { ${resolverAttributes} };`;
}

function getReturnStatementFragment(
    scope: Pick<RenderScope, 'customInstructionData' | 'nameApi'> & {
        dataArgsManifest: TypeManifest;
        hasByteDeltas: boolean;
        hasData: boolean;
        hasDataArgs: boolean;
        hasRemainingAccounts: boolean;
        instructionNode: InstructionNode;
        syncReturnTypeFragment: Fragment;
    },
): Fragment {
    const { instructionNode, hasByteDeltas, hasData, hasDataArgs, hasRemainingAccounts, nameApi } = scope;
    const optionalAccountStrategy = instructionNode.optionalAccountStrategy ?? 'programId';
    const hasAccounts = instructionNode.accounts.length > 0;
    const hasLegacyOptionalAccounts =
        instructionNode.optionalAccountStrategy === 'omitted' &&
        instructionNode.accounts.some(account => account.isOptional);

    // Account meta helper.
    const getAccountMeta = hasAccounts
        ? fragment`const getAccountMeta = ${use('getAccountMetaFactory', 'shared')}(programAddress, '${optionalAccountStrategy}');`
        : '';

    // Accounts.
    const accountItems = [
        ...instructionNode.accounts.map(account => `getAccountMeta(accounts.${camelCase(account.name)})`),
        ...(hasRemainingAccounts ? ['...remainingAccounts'] : []),
    ].join(', ');
    let accounts: Fragment | undefined;
    if (hasAccounts && hasLegacyOptionalAccounts) {
        accounts = fragment`accounts: [${accountItems}].filter(<T>(x: T | undefined): x is T => x !== undefined)`;
    } else if (hasAccounts) {
        accounts = fragment`accounts: [${accountItems}]`;
    } else if (hasRemainingAccounts) {
        accounts = fragment`accounts: remainingAccounts`;
    }

    // Data.
    const customData = scope.customInstructionData.get(instructionNode.name);
    const instructionDataName = nameApi.instructionDataType(instructionNode.name);
    const encoderFunctionFragment = customData
        ? scope.dataArgsManifest.encoder
        : `${nameApi.encoderFunction(instructionDataName)}()`;
    const argsTypeFragment = customData ? scope.dataArgsManifest.looseType : nameApi.dataArgsType(instructionDataName);
    let data: Fragment | undefined;
    if (hasDataArgs) {
        data = fragment`data: ${encoderFunctionFragment}.encode(args as ${argsTypeFragment})`;
    } else if (hasData) {
        data = fragment`data: ${encoderFunctionFragment}.encode({})`;
    }

    // Instruction.
    const instructionAttributes = pipe(
        [accounts, hasByteDeltas ? fragment`byteDelta` : undefined, data, fragment`programAddress`],
        fs => mergeFragments(fs, cs => cs.join(', ')),
    );

    return fragment`${getAccountMeta}\nreturn Object.freeze({ ${instructionAttributes} } as ${scope.syncReturnTypeFragment});`;
}

function getReturnTypeFragment(instructionTypeFragment: Fragment, hasByteDeltas: boolean, useAsync: boolean): Fragment {
    return pipe(
        instructionTypeFragment,
        f => (hasByteDeltas ? fragment`${f} & ${use('type InstructionWithByteDelta', 'shared')}` : f),
        f => (useAsync ? fragment`Promise<${f}>` : f),
    );
}

function getTypeParamsFragment(instructionNode: InstructionNode, programAddressConstant: Fragment): Fragment {
    return mergeFragments(
        [
            ...instructionNode.accounts.map(account => fragment`TAccount${pascalCase(account.name)} extends string`),
            fragment`TProgramAddress extends ${use('type Address', 'solanaAddresses')} = typeof ${programAddressConstant}`,
        ],
        cs => `<${cs.join(', ')}>`,
    );
}

function getInstructionTypeFragment(scope: { instructionPath: NodePath<InstructionNode>; nameApi: NameApi }): Fragment {
    const { instructionPath, nameApi } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);
    const instructionTypeName = nameApi.instructionType(instructionNode.name);
    const accountTypeParamsFragments = instructionNode.accounts.map(account => {
        const typeParam = fragment`TAccount${pascalCase(account.name)}`;
        const camelName = camelCase(account.name);

        if (account.isSigner === 'either') {
            const signerRole = use(
                account.isWritable ? 'type WritableSignerAccount' : 'type ReadonlySignerAccount',
                'solanaInstructions',
            );
            return pipe(
                fragment`typeof input["${camelName}"] extends TransactionSigner<${typeParam}> ? ${signerRole}<${typeParam}> & AccountSignerMeta<${typeParam}> : ${typeParam}`,
                f => addFragmentImports(f, 'solanaSigners', ['type AccountSignerMeta', 'type TransactionSigner']),
            );
        }

        return typeParam;
    });

    return pipe(
        mergeFragments([fragment`TProgramAddress`, ...accountTypeParamsFragments], c => c.join(', ')),
        f => mapFragmentContent(f, c => `${instructionTypeName}<${c}>`),
    );
}

function getInputTypeCallFragment(scope: {
    instructionPath: NodePath<InstructionNode>;
    nameApi: NameApi;
    useAsync: boolean;
}): Fragment {
    const { instructionPath, useAsync, nameApi } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);
    const inputTypeName = useAsync
        ? nameApi.instructionAsyncInputType(instructionNode.name)
        : nameApi.instructionSyncInputType(instructionNode.name);
    if (instructionNode.accounts.length === 0) return fragment`${inputTypeName}`;
    const accountTypeParams = instructionNode.accounts.map(account => `TAccount${pascalCase(account.name)}`).join(', ');

    return fragment`${inputTypeName}<${accountTypeParams}>`;
}
