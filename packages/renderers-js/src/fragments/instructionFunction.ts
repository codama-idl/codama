import { camelCase, InstructionArgumentNode, InstructionNode, isNode, isNodeFilter, pascalCase } from '@codama/nodes';
import {
    findProgramNodeFromPath,
    getLastNodeFromPath,
    NodePath,
    ResolvedInstructionInput,
} from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { NameApi } from '../nameTransformers';
import { TypeManifest } from '../TypeManifest';
import { getInstructionDependencies, hasAsyncFunction, isAsyncDefaultValue } from '../utils';
import { Fragment, fragment, fragmentFromTemplate, mergeFragments } from './common';
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
        ? dataArgsManifest.encoder.render
        : `${nameApi.encoderFunction(instructionDataName)}()`;
    const argsTypeFragment = fragment(
        customData ? dataArgsManifest.looseType.render : nameApi.dataArgsType(instructionDataName),
    );
    if (customData) {
        argsTypeFragment.mergeImportsWith(dataArgsManifest.looseType, dataArgsManifest.encoder);
    }

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
        renders => renders.join('\n\n'),
    );
    const hasRemainingAccounts = remainingAccountsFragment.render !== '';
    const hasByteDeltas = byteDeltaFragment.render !== '';
    const hasResolver = resolvedFragment.hasFeatures('instruction:resolverScopeVariable');
    const getReturnType = (instructionType: string) => {
        let returnType = instructionType;
        if (hasByteDeltas) {
            returnType = `${returnType} & InstructionWithByteDelta`;
        }
        return useAsync ? `Promise<${returnType}>` : returnType;
    };

    const functionFragment = fragmentFromTemplate('instructionFunction.njk', {
        argsTypeFragment,
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
        inputTypeCallFragment,
        inputTypeFragment,
        instruction: instructionNode,
        instructionTypeFragment,
        programAddressConstant,
        renamedArgs: renamedArgsText,
        resolvedFragment,
        typeParamsFragment,
        useAsync,
    })
        .mergeImportsWith(
            typeParamsFragment,
            instructionTypeFragment,
            inputTypeFragment,
            inputTypeCallFragment,
            resolvedFragment,
            argsTypeFragment,
        )
        .addImports('generatedPrograms', [programAddressConstant])
        .addImports('solanaAddresses', ['type Address']);

    if (hasAccounts) {
        functionFragment
            .addImports('solanaInstructions', ['type AccountMeta'])
            .addImports('shared', ['getAccountMetaFactory', 'type ResolvedAccount']);
    }

    if (hasByteDeltas) {
        functionFragment.addImports('shared', ['type InstructionWithByteDelta']);
    }

    return functionFragment;
}

function getTypeParams(instructionNode: InstructionNode, programAddressConstant: string): Fragment {
    const typeParams = instructionNode.accounts.map(account => `TAccount${pascalCase(account.name)} extends string`);
    // after all accounts, add an optional type for program address
    typeParams.push(`TProgramAddress extends Address = typeof ${programAddressConstant}`);
    return fragment(typeParams.filter(x => !!x).join(', '))
        .mapRender(r => `<${r}>`)
        .addImports('generatedPrograms', [programAddressConstant]);
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
            return fragment(
                `typeof input["${camelName}"] extends TransactionSigner<${typeParam}> ` +
                    `? ${signerRole}<${typeParam}> & AccountSignerMeta<${typeParam}> ` +
                    `: ${typeParam}`,
            )
                .addImports('solanaInstructions', [`type ${signerRole}`])
                .addImports('solanaSigners', ['type AccountSignerMeta']);
        }

        return fragment(typeParam);
    });

    return mergeFragments([programAddressFragment, ...accountTypeParamsFragments], renders =>
        renders.join(', '),
    ).mapRender(r => `${instructionTypeName}<${r}>`);
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
