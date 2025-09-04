import { ProgramNode } from '@codama/nodes';

import { Fragment, getPageFragment, mergeFragments, RenderScope } from '../utils';
import { getProgramAccountsFragment } from './programAccounts';
import { getProgramConstantFragment } from './programConstant';
import { getProgramInstructionsFragment } from './programInstructions';

export function getProgramPageFragment(
    scope: Pick<
        RenderScope,
        'dependencyMap' | 'nameApi' | 'renderParentInstructions' | 'typeManifestVisitor' | 'useGranularImports'
    > & {
        programNode: ProgramNode;
    },
): Fragment {
    return getPageFragment(
        mergeFragments(
            [
                getProgramConstantFragment(scope),
                getProgramAccountsFragment(scope),
                getProgramInstructionsFragment(scope),
            ],
            cs => cs.join('\n\n'),
        ),
        scope,
    );
}
