import { PdaNode } from '@codama/nodes';
import { findProgramNodeFromPath, NodePath } from '@codama/visitors-core';

import { Fragment, RenderScope } from '../utils';
import { getPdaFunctionFragment } from './pdaFunction';

export function getPdaPageFragment(
    scope: Pick<RenderScope, 'nameApi' | 'typeManifestVisitor'> & {
        pdaPath: NodePath<PdaNode>;
    },
): Fragment {
    if (!findProgramNodeFromPath(scope.pdaPath)) {
        throw new Error('PDA must be visited inside a program.');
    }

    return getPdaFunctionFragment(scope);
}
