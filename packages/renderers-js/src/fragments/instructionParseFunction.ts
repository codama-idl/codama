import { InstructionNode } from '@codama/nodes';
import { NodeStack } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragment, fragmentFromTemplate } from './common';

export function getInstructionParseFunctionFragment(
    scope: Pick<GlobalFragmentScope, 'customInstructionData' | 'nameApi'> & {
        dataArgsManifest: TypeManifest;
        instructionNode: InstructionNode;
        instructionStack: NodeStack;
    },
): Fragment {
    const { instructionNode, instructionStack, dataArgsManifest, nameApi, customInstructionData } = scope;
    const customData = customInstructionData.get(instructionNode.name);
    const hasAccounts = instructionNode.accounts.length > 0;
    const hasOptionalAccounts = instructionNode.accounts.some(account => account.isOptional);
    const minimumNumberOfAccounts =
        instructionNode.optionalAccountStrategy === 'omitted'
            ? instructionNode.accounts.filter(account => !account.isOptional).length
            : instructionNode.accounts.length;
    const hasData = !!customData || instructionNode.arguments.length > 0;

    const instructionDataName = nameApi.instructionDataType(instructionNode.name);
    const programAddressConstant = nameApi.programAddressConstant(instructionStack.getProgram()!.name);
    const dataTypeFragment = fragment(
        customData ? dataArgsManifest.strictType.render : nameApi.dataType(instructionDataName),
    );
    const decoderFunction = customData
        ? dataArgsManifest.decoder.render
        : `${nameApi.decoderFunction(instructionDataName)}()`;
    if (customData) {
        dataTypeFragment.mergeImportsWith(dataArgsManifest.strictType, dataArgsManifest.decoder);
    }

    return fragmentFromTemplate('instructionParseFunction.njk', {
        dataTypeFragment,
        decoderFunction,
        hasAccounts,
        hasData,
        hasOptionalAccounts,
        instruction: instructionNode,
        instructionParseFunction: nameApi.instructionParseFunction(instructionNode.name),
        instructionParsedType: nameApi.instructionParsedType(instructionNode.name),
        minimumNumberOfAccounts,
        programAddressConstant,
    })
        .mergeImportsWith(dataTypeFragment)
        .addImports('generatedPrograms', [programAddressConstant])
        .addImports('solanaInstructions', ['type IInstruction'])
        .addImports('solanaInstructions', hasAccounts ? ['type IInstructionWithAccounts', 'type IAccountMeta'] : [])
        .addImports('solanaInstructions', hasData ? ['type IInstructionWithData'] : []);
}
