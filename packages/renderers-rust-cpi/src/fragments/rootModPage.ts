import { InstructionNode, ProgramNode } from '@codama/nodes';

import { Fragment, fragment, getPageFragment, mergeFragments, RenderScope } from '../utils';

export function getRootModPageFragment(
    scope: Pick<RenderScope, 'dependencyMap'> & {
        instructionsToExport: InstructionNode[];
        programsToExport: ProgramNode[];
    },
): Fragment | undefined {
    const hasPrograms = scope.programsToExport.length > 0;
    const hasInstructions = scope.instructionsToExport.length > 0;
    const hasAnythingToExport = hasPrograms || hasInstructions;
    if (!hasAnythingToExport) return;

    return getPageFragment(
        mergeFragments(
            [
                hasInstructions ? fragment`pub mod instructions;` : undefined,
                hasPrograms ? fragment`pub mod programs;` : undefined,
            ],
            cs => cs.join('\n'),
        ),
        scope,
    );
}
