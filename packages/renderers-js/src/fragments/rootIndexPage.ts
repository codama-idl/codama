import { AccountNode, DefinedTypeNode, InstructionNode, PdaNode, ProgramNode } from '@codama/nodes';

import { Fragment, fragment, getExportAllFragment, mergeFragments } from '../utils';

export function getRootIndexPageFragment(scope: {
    accountsToExport: AccountNode[];
    definedTypesToExport: DefinedTypeNode[];
    instructionsToExport: InstructionNode[];
    pdasToExport: PdaNode[];
    programsToExport: ProgramNode[];
}): Fragment {
    const hasAnythingToExport =
        scope.programsToExport.length > 0 ||
        scope.accountsToExport.length > 0 ||
        scope.instructionsToExport.length > 0 ||
        scope.definedTypesToExport.length > 0;

    if (!hasAnythingToExport) {
        return fragment`export default {};`;
    }

    const programsWithErrorsToExport = scope.programsToExport.filter(p => p.errors.length > 0);

    return mergeFragments(
        [
            scope.accountsToExport.length > 0 ? getExportAllFragment('./accounts') : undefined,
            programsWithErrorsToExport.length > 0 ? getExportAllFragment('./errors') : undefined,
            scope.instructionsToExport.length > 0 ? getExportAllFragment('./instructions') : undefined,
            scope.pdasToExport.length > 0 ? getExportAllFragment('./pdas') : undefined,
            scope.programsToExport.length > 0 ? getExportAllFragment('./programs') : undefined,
            scope.definedTypesToExport.length > 0 ? getExportAllFragment('./types') : undefined,
        ],
        cs => cs.join('\n'),
    );
}
