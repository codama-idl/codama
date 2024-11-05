import { InstructionNode } from '@codama/nodes';
import { getLastNodeFromPath, NodePath } from '@codama/visitors-core';

import { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragment, fragmentFromTemplate } from './common';

export function getInstructionExtraArgsFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        extraArgsManifest: TypeManifest;
        instructionPath: NodePath<InstructionNode>;
    },
): Fragment {
    const { instructionPath, extraArgsManifest, nameApi } = scope;
    const instructionNode = getLastNodeFromPath(instructionPath);
    if ((instructionNode.extraArguments ?? []).length === 0) {
        return fragment('');
    }

    const instructionExtraName = nameApi.instructionExtraType(instructionNode.name);
    return fragmentFromTemplate('instructionExtraArgs.njk', {
        looseName: nameApi.dataArgsType(instructionExtraName),
        manifest: extraArgsManifest,
        strictName: nameApi.dataType(instructionExtraName),
    }).mergeImportsWith(extraArgsManifest.looseType);
}
