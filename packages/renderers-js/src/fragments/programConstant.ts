import { ProgramNode } from '@codama/nodes';
import { pipe } from '@codama/visitors-core';

import { addFragmentImports, Fragment, fragment, RenderScope } from '../utils';

export function getProgramConstantFragment(
    scope: Pick<RenderScope, 'nameApi'> & { programNode: ProgramNode },
): Fragment {
    const { programNode, nameApi } = scope;
    const programAddressConstant = nameApi.programAddressConstant(programNode.name);

    return pipe(
        fragment`export const ${programAddressConstant} = '${programNode.publicKey}' as Address<'${programNode.publicKey}'>;`,
        f => addFragmentImports(f, 'solanaAddresses', ['type Address']),
    );
}
