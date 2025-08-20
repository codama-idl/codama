import { InstructionNode } from '@codama/nodes';
import { findProgramNodeFromPath, getLastNodeFromPath, NodePath, pipe } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { addFragmentImports, Fragment, fragment, fragmentFromTemplate, mergeFragmentImports } from '../utils';

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
    const dataTypeFragment = customData
        ? pipe(fragment(dataArgsManifest.strictType.content), f =>
              mergeFragmentImports(f, [dataArgsManifest.strictType.imports, dataArgsManifest.decoder.imports]),
          )
        : fragment(nameApi.dataType(instructionDataName));
    const decoderFunction = customData
        ? dataArgsManifest.decoder.content
        : `${nameApi.decoderFunction(instructionDataName)}()`;

    return pipe(
        fragmentFromTemplate('instructionParseFunction.njk', {
            dataTypeFragment: dataTypeFragment.content,
            decoderFunction,
            hasAccounts,
            hasData,
            hasOptionalAccounts,
            instruction: instructionNode,
            instructionParseFunction: nameApi.instructionParseFunction(instructionNode.name),
            instructionParsedType: nameApi.instructionParsedType(instructionNode.name),
            minimumNumberOfAccounts,
            programAddressConstant,
        }),
        f => mergeFragmentImports(f, [dataTypeFragment.imports]),
        f => addFragmentImports(f, 'generatedPrograms', [programAddressConstant]),
        f => addFragmentImports(f, 'solanaInstructions', ['type Instruction']),
        hasAccounts
            ? f => addFragmentImports(f, 'solanaInstructions', ['type InstructionWithAccounts', 'type AccountMeta'])
            : f => f,
        hasData
            ? f =>
                  addFragmentImports(
                      addFragmentImports(f, 'solanaInstructions', ['type InstructionWithData']),
                      'solanaCodecsCore',
                      ['type ReadonlyUint8Array'],
                  )
            : f => f,
    );
}
