import { camelCase, InstructionArgumentNode, InstructionNode, isNode, isNodeFilter, pascalCase } from '@codama/nodes';
import { mapFragmentContent } from '@codama/renderers-core';
import {
    findProgramNodeFromPath,
    getLastNodeFromPath,
    NodePath,
    pipe,
    ResolvedInstructionInput,
} from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { NameApi } from '../nameTransformers';
import { TypeManifest } from '../TypeManifest';
import {
    addFragmentImports,
    Fragment,
    fragment,
    fragmentFromTemplate,
    getInstructionDependencies,
    hasAsyncFunction,
    isAsyncDefaultValue,
    mergeFragmentImports,
    mergeFragments,
} from '../utils';
import { getInstructionByteDeltaFragment } from './instructionByteDelta';
import { getInstructionInputResolvedFragment } from './instructionInputResolved';
import { getInstructionInputTypeFragment } from './instructionInputType';
import { getInstructionRemainingAccountsFragment } from './instructionRemainingAccounts';

export function getInstructionFunctionFragment(
    scope: Pick<
        GlobalFragmentScope,
        'asyncResolvers' | 'customInstructionData' | 'getImportFrom' | 'nameApi' | 'typeManifestVisitor'
    > & {
        dataArgsManifest: TypeManifest;
        extraArgsManifest: TypeManifest;
        instructionPath: NodePath<InstructionNode>;
        renamedArgs: Map<string, string>;
        resolvedInputs: ResolvedInstructionInput[];
        useAsync: boolean;
    },
): Fragment {
    const {
        useAsync,
        instructionPath,
        resolvedInputs,
        renamedArgs,
        dataArgsManifest,
        asyncResolvers,
        nameApi,
        customInstructionData,
    } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);
    const programNode = findProgramNodeFromPath(instructionPath)!;
    if (useAsync && !hasAsyncFunction(instructionNode, resolvedInputs, asyncResolvers)) {
        return fragment('');
    }

    const customData = customInstructionData.get(instructionNode.name);
    const hasAccounts = instructionNode.accounts.length > 0;
    const hasLegacyOptionalAccounts =
        instructionNode.optionalAccountStrategy === 'omitted' &&
        instructionNode.accounts.some(account => account.isOptional);
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
    const instructionDataName = nameApi.instructionDataType(instructionNode.name);
    const programAddressConstant = nameApi.programAddressConstant(programNode.name);
    const encoderFunction = customData
        ? dataArgsManifest.encoder.content
        : `${nameApi.encoderFunction(instructionDataName)}()`;
    const argsTypeFragment = pipe(
        fragment(customData ? dataArgsManifest.looseType.content : nameApi.dataArgsType(instructionDataName)),
        customData
            ? f => mergeFragmentImports(f, [dataArgsManifest.looseType.imports, dataArgsManifest.encoder.imports])
            : f => f,
    );

    const functionName = useAsync
        ? nameApi.instructionAsyncFunction(instructionNode.name)
        : nameApi.instructionSyncFunction(instructionNode.name);

    const typeParamsFragment = getTypeParams(instructionNode, programAddressConstant);
    const instructionTypeFragment = getInstructionType(scope);

    // Input.
    const inputTypeFragment = getInstructionInputTypeFragment(scope);
    const inputTypeCallFragment = getInputTypeCall(scope);
    const renamedArgsText = [...renamedArgs.entries()].map(([k, v]) => `${k}: input.${v}`).join(', ');

    const resolvedInputsFragment = getInstructionInputResolvedFragment(scope);
    const remainingAccountsFragment = getInstructionRemainingAccountsFragment(scope);
    const byteDeltaFragment = getInstructionByteDeltaFragment(scope);
    const resolvedFragment = mergeFragments(
        [resolvedInputsFragment, remainingAccountsFragment, byteDeltaFragment],
        content => content.join('\n\n'),
    );
    const hasRemainingAccounts = remainingAccountsFragment.content !== '';
    const hasByteDeltas = byteDeltaFragment.content !== '';
    const hasResolver = resolvedFragment.features.has('instruction:resolverScopeVariable');
    const getReturnType = (instructionType: string) => {
        let returnType = instructionType;
        if (hasByteDeltas) {
            returnType = `${returnType} & InstructionWithByteDelta`;
        }
        return useAsync ? `Promise<${returnType}>` : returnType;
    };

    return pipe(
        fragmentFromTemplate('instructionFunction.njk', {
            argsTypeFragment: argsTypeFragment.content,
            encoderFunction,
            functionName,
            getReturnType,
            hasAccounts,
            hasAnyArgs,
            hasByteDeltas,
            hasData,
            hasDataArgs,
            hasExtraArgs,
            hasInput,
            hasLegacyOptionalAccounts,
            hasRemainingAccounts,
            hasResolver,
            inputTypeCallFragment: inputTypeCallFragment.content,
            inputTypeFragment: inputTypeFragment.content,
            instruction: instructionNode,
            instructionTypeFragment: instructionTypeFragment.content,
            programAddressConstant,
            renamedArgs: renamedArgsText,
            resolvedFragment: resolvedFragment.content,
            typeParamsFragment: typeParamsFragment.content,
            useAsync,
        }),
        f =>
            mergeFragmentImports(f, [
                typeParamsFragment.imports,
                instructionTypeFragment.imports,
                inputTypeFragment.imports,
                inputTypeCallFragment.imports,
                resolvedFragment.imports,
                argsTypeFragment.imports,
            ]),
        f => addFragmentImports(f, 'generatedPrograms', [programAddressConstant]),
        f => addFragmentImports(f, 'solanaAddresses', ['type Address']),
        f => (hasAccounts ? addFragmentImports(f, 'solanaInstructions', ['type AccountMeta']) : f),
        f => (hasAccounts ? addFragmentImports(f, 'shared', ['getAccountMetaFactory', 'type ResolvedAccount']) : f),
        f => (hasByteDeltas ? addFragmentImports(f, 'shared', ['type InstructionWithByteDelta']) : f),
    );
}

function getTypeParams(instructionNode: InstructionNode, programAddressConstant: string): Fragment {
    const typeParams = instructionNode.accounts.map(account => `TAccount${pascalCase(account.name)} extends string`);
    // after all accounts, add an optional type for program address
    typeParams.push(`TProgramAddress extends Address = typeof ${programAddressConstant}`);
    return pipe(
        fragment(typeParams.filter(x => !!x).join(', ')),
        f => mapFragmentContent(f, c => `<${c}>`),
        f => addFragmentImports(f, 'generatedPrograms', [programAddressConstant]),
    );
}

function getInstructionType(scope: { instructionPath: NodePath<InstructionNode>; nameApi: NameApi }): Fragment {
    const { instructionPath, nameApi } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);
    const instructionTypeName = nameApi.instructionType(instructionNode.name);
    const programAddressFragment = fragment('TProgramAddress');
    const accountTypeParamsFragments = instructionNode.accounts.map(account => {
        const typeParam = `TAccount${pascalCase(account.name)}`;
        const camelName = camelCase(account.name);

        if (account.isSigner === 'either') {
            const signerRole = account.isWritable ? 'WritableSignerAccount' : 'ReadonlySignerAccount';
            return pipe(
                fragment(
                    `typeof input["${camelName}"] extends TransactionSigner<${typeParam}> ` +
                        `? ${signerRole}<${typeParam}> & AccountSignerMeta<${typeParam}> ` +
                        `: ${typeParam}`,
                ),
                f => addFragmentImports(f, 'solanaInstructions', [`type ${signerRole}`]),
                f => addFragmentImports(f, 'solanaSigners', ['type AccountSignerMeta']),
            );
        }

        return fragment(typeParam);
    });

    return pipe(
        mergeFragments([programAddressFragment, ...accountTypeParamsFragments], c => c.join(', ')),
        f => mapFragmentContent(f, c => `${instructionTypeName}<${c}>`),
    );
}

function getInputTypeCall(scope: {
    instructionPath: NodePath<InstructionNode>;
    nameApi: NameApi;
    useAsync: boolean;
}): Fragment {
    const { instructionPath, useAsync, nameApi } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);
    const inputTypeName = useAsync
        ? nameApi.instructionAsyncInputType(instructionNode.name)
        : nameApi.instructionSyncInputType(instructionNode.name);
    if (instructionNode.accounts.length === 0) return fragment(inputTypeName);
    const accountTypeParams = instructionNode.accounts.map(account => `TAccount${pascalCase(account.name)}`).join(', ');

    return fragment(`${inputTypeName}<${accountTypeParams}>`);
}
