import { ProgramNode } from '@kinobi-so/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, fragmentFromTemplate } from './common';

export function getProgramFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        programNode: ProgramNode;
    },
): Fragment {
    const { programNode, nameApi } = scope;

    return fragmentFromTemplate('program.njk', {
        program: programNode,
        programAddressConstant: nameApi.programAddressConstant(programNode.name),
    }).addImports('solanaAddresses', ['type Address']);
}
