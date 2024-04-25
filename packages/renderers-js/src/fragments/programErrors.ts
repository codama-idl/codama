import { ProgramNode } from '@kinobi-so/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, fragmentFromTemplate } from './common';

export function getProgramErrorsFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        programNode: ProgramNode;
    },
): Fragment {
    const { programNode, nameApi } = scope;
    return fragmentFromTemplate('programErrors.njk', {
        errors: programNode.errors,
        getProgramErrorConstant: (name: string) =>
            nameApi.programErrorConstantPrefix(programNode.name) + nameApi.programErrorConstant(name),
        programErrorMessagesMap: nameApi.programErrorMessagesMap(programNode.name),
        programErrorUnion: nameApi.programErrorUnion(programNode.name),
        programGetErrorMessageFunction: nameApi.programGetErrorMessageFunction(programNode.name),
    });
}
