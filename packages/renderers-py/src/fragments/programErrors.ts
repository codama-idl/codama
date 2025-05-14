import { ProgramNode } from '@codama/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, fragmentFromTemplate } from './common';

export function getProgramErrorsFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        programNode: ProgramNode;
    },
): Fragment {
    const { programNode, nameApi } = scope;
    const programAddressConstant = nameApi.programAddressConstant(programNode.name);
    return fragmentFromTemplate('programErrors.njk', {
        errors: programNode.errors,
        escapeProgramErrorMessage: (message: string) => message.replace(/`/g, '\\`'),
        getProgramErrorConstant: (name: string) =>
            nameApi.programErrorConstantPrefix(programNode.name) + nameApi.programErrorConstant(name),
        programAddressConstant,
        programErrorMessagesMap: nameApi.programErrorMessagesMap(programNode.name),
        programErrorUnion: nameApi.programErrorUnion(programNode.name),
        programGetErrorMessageFunction: nameApi.programGetErrorMessageFunction(programNode.name),
        programIsErrorFunction: nameApi.programIsErrorFunction(programNode.name),
    })
        .addImports('generatedPrograms', [programAddressConstant])
        .addImports('solanaPrograms', ['isProgramError'])
        .addImports('solanaErrors', ['type SolanaError', 'type SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM'])
        .addImports('solanaAddresses', ['type Address']);
}
