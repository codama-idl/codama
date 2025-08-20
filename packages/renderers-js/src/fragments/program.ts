import { ProgramNode } from '@codama/nodes';
import { pipe } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { addFragmentImports, Fragment, fragmentFromTemplate } from '../utils';

export function getProgramFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        programNode: ProgramNode;
    },
): Fragment {
    const { programNode, nameApi } = scope;

    return pipe(
        fragmentFromTemplate('program.njk', {
            program: programNode,
            programAddressConstant: nameApi.programAddressConstant(programNode.name),
        }),
        f => addFragmentImports(f, 'solanaAddresses', ['type Address']),
    );
}
