import { InstructionNode } from '@codama/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragment } from './common';
import { getTypeWithCodecFragment } from './typeWithCodec';

export function getInstructionDataFragment(
    scope: Pick<GlobalFragmentScope, 'customInstructionData' | 'nameApi'> & {
        dataArgsManifest: TypeManifest;
        instructionNode: InstructionNode;
    },
): Fragment {
    const { instructionNode, dataArgsManifest, nameApi, customInstructionData } = scope;
    if (instructionNode.arguments.length === 0 || customInstructionData.has(instructionNode.name)) {
        return fragment('');
    }

    const instructionDataName = nameApi.instructionDataType(instructionNode.name);
    return getTypeWithCodecFragment({
        manifest: dataArgsManifest,
        name: instructionDataName,
        nameApi,
    });
}
