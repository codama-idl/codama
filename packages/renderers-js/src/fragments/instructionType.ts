import { InstructionNode, pascalCase } from '@codama/nodes';
import { mapFragmentContent } from '@codama/renderers-core';
import { findProgramNodeFromPath, getLastNodeFromPath, NodePath, pipe } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { addFragmentImports, Fragment, fragmentFromTemplate, mergeFragmentImports, mergeFragments } from '../utils';
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
            mapFragmentContent(getInstructionAccountMetaFragment(account), c => {
                const typeParam = `TAccount${pascalCase(account.name)}`;
                const isLegacyOptional = account.isOptional && usesLegacyOptionalAccounts;
                const type = `${typeParam} extends string ? ${c} : ${typeParam}`;
                if (!isLegacyOptional) return type;
                return `...(${typeParam} extends undefined ? [] : [${type}])`;
            }),
        ),
        c => c.join(', '),
    );

    const fragment = pipe(
        fragmentFromTemplate('instructionType.njk', {
            accountMetas: accountMetasFragment.content,
            accountTypeParams: accountTypeParamsFragment.content,
            dataType,
            hasAccounts,
            hasData,
            instruction: instructionNode,
            instructionType: nameApi.instructionType(instructionNode.name),
            programAddressConstant,
        }),
        f => mergeFragmentImports(f, [accountTypeParamsFragment.imports, accountMetasFragment.imports]),
        f => addFragmentImports(f, 'generatedPrograms', [programAddressConstant]),
        f =>
            addFragmentImports(f, 'solanaInstructions', [
                'type AccountMeta',
                'type Instruction',
                'type InstructionWithAccounts',
                ...(hasData ? ['type InstructionWithData'] : []),
            ]),
    );

    // TODO: if link, add import for data type. Unless we don't need to inject the data type in InstructionWithData.

    return fragment;
}
