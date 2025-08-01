import { InstructionNode } from '@codama/nodes';
import { findProgramNodeFromPath, getLastNodeFromPath, NodePath } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragment, fragmentFromTemplate } from './common';

export function getInstructionParseFunctionFragment(
    scope: Pick<GlobalFragmentScope, 'customInstructionData' | 'nameApi'> & {
        dataArgsManifest: TypeManifest;
        instructionPath: NodePath<InstructionNode>;
    },
): Fragment {
    const { instructionPath, dataArgsManifest, nameApi, customInstructionData } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);
    const programNode = findProgramNodeFromPath(instructionPath)!;
    const customData = customInstructionData.get(instructionNode.name);
    const hasAccounts = instructionNode.accounts.length > 0;
    const hasOptionalAccounts = instructionNode.accounts.some(account => account.isOptional);
    const minimumNumberOfAccounts =
        instructionNode.optionalAccountStrategy === 'omitted'
            ? instructionNode.accounts.filter(account => !account.isOptional).length
            : instructionNode.accounts.length;
    const hasData = !!customData || instructionNode.arguments.length > 0;

    const instructionDataName = nameApi.instructionDataType(instructionNode.name);
    const programAddressConstant = nameApi.programAddressConstant(programNode.name);
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
        .addImports('solanaInstructions', ['type Instruction'])
        .addImports('solanaInstructions', hasAccounts ? ['type InstructionWithAccounts', 'type AccountMeta'] : [])
        .addImports('solanaInstructions', hasData ? ['type InstructionWithData'] : [])
        .addImports('solanaCodecsCore', hasData ? ['type ReadonlyUint8Array'] : []);
}
