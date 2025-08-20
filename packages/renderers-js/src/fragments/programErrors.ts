import { ProgramNode } from '@codama/nodes';
import { pipe } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { addFragmentImports, Fragment, fragmentFromTemplate } from '../utils';

export function getProgramErrorsFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        programNode: ProgramNode;
    },
): Fragment {
    const { programNode, nameApi } = scope;
    const programAddressConstant = nameApi.programAddressConstant(programNode.name);
    return pipe(
        fragmentFromTemplate('programErrors.njk', {
            errors: programNode.errors,
            escapeProgramErrorMessage: (message: string) => message.replace(/`/g, '\\`'),
            getProgramErrorConstant: (name: string) =>
                nameApi.programErrorConstantPrefix(programNode.name) + nameApi.programErrorConstant(name),
            programAddressConstant,
            programErrorMessagesMap: nameApi.programErrorMessagesMap(programNode.name),
            programErrorUnion: nameApi.programErrorUnion(programNode.name),
            programGetErrorMessageFunction: nameApi.programGetErrorMessageFunction(programNode.name),
            programIsErrorFunction: nameApi.programIsErrorFunction(programNode.name),
        }),
        f => addFragmentImports(f, 'generatedPrograms', [programAddressConstant]),
        f => addFragmentImports(f, 'solanaPrograms', ['isProgramError']),
        f =>
            addFragmentImports(f, 'solanaErrors', ['type SolanaError', 'type SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM']),
        f => addFragmentImports(f, 'solanaAddresses', ['type Address']),
    );
}
