import { InstructionNode, pascalCase } from '@codama/nodes';
import { findProgramNodeFromPath, getLastNodeFromPath, NodePath } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, fragmentFromTemplate, mergeFragments } from './common';
import { getInstructionAccountMetaFragment } from './instructionAccountMeta';
import { getInstructionAccountTypeParamFragment } from './instructionAccountTypeParam';

export function getInstructionTypeFragment(
    scope: Pick<GlobalFragmentScope, 'customInstructionData' | 'linkables' | 'nameApi'> & {
        instructionPath: NodePath<InstructionNode>;
    },
): Fragment {
    const { instructionPath, nameApi, customInstructionData } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);
    const programNode = findProgramNodeFromPath(instructionPath)!;
    const hasAccounts = instructionNode.accounts.length > 0;
    const customData = customInstructionData.get(instructionNode.name);
    const hasData = !!customData || instructionNode.arguments.length > 0;
    const instructionDataName = nameApi.instructionDataType(instructionNode.name);
    const programAddressConstant = nameApi.programAddressConstant(programNode.name);
    const dataType = customData ? pascalCase(customData.importAs) : pascalCase(instructionDataName);
    const accountTypeParamsFragment = mergeFragments(
        instructionNode.accounts.map(account =>
            getInstructionAccountTypeParamFragment({
                ...scope,
                allowAccountMeta: true,
                instructionAccountPath: [...instructionPath, account],
            }),
        ),
        renders => renders.join(', '),
    );
    const usesLegacyOptionalAccounts = instructionNode.optionalAccountStrategy === 'omitted';
    const accountMetasFragment = mergeFragments(
        instructionNode.accounts.map(account =>
            getInstructionAccountMetaFragment(account).mapRender(r => {
                const typeParam = `TAccount${pascalCase(account.name)}`;
                const isLegacyOptional = account.isOptional && usesLegacyOptionalAccounts;
                const type = `${typeParam} extends string ? ${r} : ${typeParam}`;
                if (!isLegacyOptional) return type;
                return `...(${typeParam} extends undefined ? [] : [${type}])`;
            }),
        ),
        renders => renders.join(', '),
    );

    const fragment = fragmentFromTemplate('instructionType.njk', {
        accountMetas: accountMetasFragment.render,
        accountTypeParams: accountTypeParamsFragment.render,
        dataType,
        hasAccounts,
        hasData,
        instruction: instructionNode,
        instructionType: nameApi.instructionType(instructionNode.name),
        programAddressConstant,
    })
        .mergeImportsWith(accountTypeParamsFragment, accountMetasFragment)
        .addImports('generatedPrograms', [programAddressConstant])
        .addImports('solanaInstructions', [
            'type AccountMeta',
            'type Instruction',
            'type InstructionWithAccounts',
            ...(hasData ? ['type InstructionWithData'] : []),
        ]);

    // TODO: if link, add import for data type. Unless we don't need to inject the data type in InstructionWithData.

    return fragment;
}
