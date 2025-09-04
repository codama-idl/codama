import { InstructionNode, pascalCase } from '@codama/nodes';
import { mapFragmentContent } from '@codama/renderers-core';
import { findProgramNodeFromPath, getLastNodeFromPath, NodePath } from '@codama/visitors-core';

import { Fragment, fragment, mergeFragments, RenderScope, use } from '../utils';
import { getInstructionAccountMetaFragment } from './instructionAccountMeta';
import { getInstructionAccountTypeParamFragment } from './instructionAccountTypeParam';

export function getInstructionTypeFragment(
    scope: Pick<RenderScope, 'customInstructionData' | 'linkables' | 'nameApi'> & {
        instructionPath: NodePath<InstructionNode>;
    },
): Fragment {
    const { instructionPath, nameApi, customInstructionData } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);
    const programNode = findProgramNodeFromPath(instructionPath)!;
    const hasAccounts = instructionNode.accounts.length > 0;
    const customData = customInstructionData.get(instructionNode.name);
    const hasData = !!customData || instructionNode.arguments.length > 0;

    const instructionType = nameApi.instructionType(instructionNode.name);
    const programAddressConstant = use(nameApi.programAddressConstant(programNode.name), 'generatedPrograms');

    const accountTypeParams = mergeFragments(
        instructionNode.accounts.map(account =>
            getInstructionAccountTypeParamFragment({
                ...scope,
                allowAccountMeta: true,
                instructionAccountPath: [...instructionPath, account],
            }),
        ),
        cs => (cs.length > 0 ? `${cs.join(', ')}, ` : ''),
    );

    const data = hasData
        ? fragment` & ${use('type InstructionWithData', 'solanaInstructions')}<${use('type ReadonlyUint8Array', 'solanaCodecsCore')}>`
        : undefined;

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

    const instructionWithAccounts = use('type InstructionWithAccounts', 'solanaInstructions');
    const accounts = hasAccounts
        ? fragment` & ${instructionWithAccounts}<[${accountMetasFragment}, ...TRemainingAccounts]>`
        : fragment` & ${instructionWithAccounts}<TRemainingAccounts>`;

    return fragment`export type ${instructionType}<TProgram extends string = typeof ${programAddressConstant}, ${accountTypeParams}TRemainingAccounts extends readonly ${use('type AccountMeta', 'solanaInstructions')}<string>[] = []> =
${use('type Instruction', 'solanaInstructions')}<TProgram>${data}${accounts};`;
}
