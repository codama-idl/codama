import { InstructionNode } from '@codama/nodes';
import { getLastNodeFromPath, NodePath } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragment } from './common';
import { getTypeWithCodecFragment } from './typeWithCodec';

export function getInstructionDataFragment(
    scope: Pick<GlobalFragmentScope, 'customInstructionData' | 'nameApi'> & {
        dataArgsManifest: TypeManifest;
        instructionPath: NodePath<InstructionNode>;
    },
): Fragment {
    const { instructionPath, dataArgsManifest, nameApi, customInstructionData } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);
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
