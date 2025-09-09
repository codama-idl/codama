import { ProgramNode } from '@codama/nodes';

import { Fragment, fragment, getDocblockFragment, mergeFragments, RenderScope, use } from '../utils';

export function getErrorPageFragment(scope: Pick<RenderScope, 'nameApi'> & { programNode: ProgramNode }): Fragment {
    return mergeFragments(
        [
            getConstantsFragment(scope),
            getConstantUnionTypeFragment(scope),
            getErrorMessagesFragment(scope),
            getErrorMessageFunctionFragment(scope),
            getIsErrorFunctionFragment(scope),
        ],
        cs => cs.join('\n\n'),
    );
}

function getConstantsFragment(scope: Pick<RenderScope, 'nameApi'> & { programNode: ProgramNode }): Fragment {
    const constantPrefix = scope.nameApi.programErrorConstantPrefix(scope.programNode.name);
    return mergeFragments(
        [...scope.programNode.errors]
            .sort((a, b) => a.code - b.code)
            .map(error => {
                const docs = getDocblockFragment(error.docs ?? [], true);
                const name = constantPrefix + scope.nameApi.programErrorConstant(error.name);
                return fragment`${docs}export const ${name} = 0x${error.code.toString(16)}; // ${error.code}`;
            }),
        cs => cs.join('\n'),
    );
}

function getConstantUnionTypeFragment(scope: Pick<RenderScope, 'nameApi'> & { programNode: ProgramNode }): Fragment {
    const constantPrefix = scope.nameApi.programErrorConstantPrefix(scope.programNode.name);
    const typeName = scope.nameApi.programErrorUnion(scope.programNode.name);
    const errorTypes = mergeFragments(
        [...scope.programNode.errors]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(error => fragment`typeof ${constantPrefix + scope.nameApi.programErrorConstant(error.name)}`),
        cs => cs.join(' | '),
    );

    return fragment`export type ${typeName} = ${errorTypes};`;
}

function getErrorMessagesFragment(scope: Pick<RenderScope, 'nameApi'> & { programNode: ProgramNode }): Fragment {
    const mapName = scope.nameApi.programErrorMessagesMap(scope.programNode.name);
    const errorUnionType = scope.nameApi.programErrorUnion(scope.programNode.name);
    const constantPrefix = scope.nameApi.programErrorConstantPrefix(scope.programNode.name);
    const messageEntries = mergeFragments(
        [...scope.programNode.errors]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(error => {
                const constantName = constantPrefix + scope.nameApi.programErrorConstant(error.name);
                const escapedMessage = error.message.replace(/`/g, '\\`');
                return fragment`[${constantName}]: \`${escapedMessage}\``;
            }),
        cs => cs.join(', '),
    );

    return fragment`let ${mapName}: Record<${errorUnionType}, string> | undefined;
if (process.env.NODE_ENV !== 'production') {
  ${mapName} = { ${messageEntries} };
}`;
}

function getErrorMessageFunctionFragment(scope: Pick<RenderScope, 'nameApi'> & { programNode: ProgramNode }): Fragment {
    const functionName = scope.nameApi.programGetErrorMessageFunction(scope.programNode.name);
    const errorUnionType = scope.nameApi.programErrorUnion(scope.programNode.name);
    const messageMapName = scope.nameApi.programErrorMessagesMap(scope.programNode.name);

    return fragment`export function ${functionName}(code: ${errorUnionType}): string {
  if (process.env.NODE_ENV !== 'production') {
    return (${messageMapName} as Record<${errorUnionType}, string>)[code];
  }

  return 'Error message not available in production bundles.';
}`;
}

function getIsErrorFunctionFragment(scope: Pick<RenderScope, 'nameApi'> & { programNode: ProgramNode }): Fragment {
    const { programNode, nameApi } = scope;
    const programAddressConstant = use(nameApi.programAddressConstant(programNode.name), 'generatedPrograms');
    const functionName = nameApi.programIsErrorFunction(programNode.name);
    const programErrorUnion = nameApi.programErrorUnion(programNode.name);

    return fragment`export function ${functionName}<TProgramErrorCode extends ${programErrorUnion}>(
    error: unknown,
    transactionMessage: { instructions: Record<number, { programAddress: ${use('type Address', 'solanaAddresses')} }> },
    code?: TProgramErrorCode,
): error is ${use('type SolanaError', 'solanaErrors')}<typeof ${use('type SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM', 'solanaErrors')}> & Readonly<{ context: Readonly<{ code: TProgramErrorCode }> }> {
  return ${use('isProgramError', 'solanaPrograms')}<TProgramErrorCode>(error, transactionMessage, ${programAddressConstant}, code);
}`;
}
