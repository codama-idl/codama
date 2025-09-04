import { InstructionNode } from '@codama/nodes';
import { mapFragmentContent } from '@codama/renderers-core';
import { getLastNodeFromPath, NodePath } from '@codama/visitors-core';

import { TypeManifest } from '../TypeManifest';
import { Fragment, RenderScope } from '../utils';

export function getInstructionExtraArgsFragment(
    scope: Pick<RenderScope, 'nameApi'> & {
        extraArgsManifest: TypeManifest;
        instructionPath: NodePath<InstructionNode>;
    },
): Fragment | undefined {
    const { instructionPath, extraArgsManifest, nameApi } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);
    if ((instructionNode.extraArguments ?? []).length === 0) return;

    const instructionExtraName = nameApi.instructionExtraType(instructionNode.name);
    const looseName = nameApi.dataArgsType(instructionExtraName);
    return mapFragmentContent(extraArgsManifest.looseType, c => `export type ${looseName} = ${c};`);
}
