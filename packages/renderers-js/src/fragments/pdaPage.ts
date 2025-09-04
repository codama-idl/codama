import { PdaNode } from '@codama/nodes';
import { findProgramNodeFromPath, NodePath } from '@codama/visitors-core';

import { Fragment, getPageFragment, RenderScope } from '../utils';
import { getPdaFunctionFragment } from './pdaFunction';

export function getPdaPageFragment(
    scope: Pick<RenderScope, 'dependencyMap' | 'nameApi' | 'typeManifestVisitor' | 'useGranularImports'> & {
        pdaPath: NodePath<PdaNode>;
    },
): Fragment {
    if (!findProgramNodeFromPath(scope.pdaPath)) {
        throw new Error('PDA must be visited inside a program.');
    }

    return getPageFragment(getPdaFunctionFragment(scope), scope);
}
