import { camelCase, InstructionNode } from '@codama/nodes';
import { findProgramNodeFromPath, getLastNodeFromPath, NodePath, pipe } from '@codama/visitors-core';

import {
    addFragmentImports,
    Fragment,
    fragment,
    getDocblockFragment,
    mergeFragments,
    RenderScope,
    TypeManifest,
    use,
} from '../utils';

export function getInstructionParseFunctionFragment(
    scope: Pick<RenderScope, 'customInstructionData' | 'nameApi'> & {
        dataArgsManifest: TypeManifest;
        instructionPath: NodePath<InstructionNode>;
    },
): Fragment {
    const instructionNode = getLastNodeFromPath(scope.instructionPath);
    const programNode = findProgramNodeFromPath(scope.instructionPath)!;
    const programAddressConstant = use(scope.nameApi.programAddressConstant(programNode.name), 'generatedPrograms');
    const childScope = { ...scope, instructionNode, programAddressConstant };

    return mergeFragments([getTypeFragment(childScope), getFunctionFragment(childScope)], cs => cs.join('\n\n'));
}

function getTypeFragment(
    scope: Pick<RenderScope, 'customInstructionData' | 'nameApi'> & {
        dataArgsManifest: TypeManifest;
        instructionNode: InstructionNode;
        programAddressConstant: Fragment;
    },
): Fragment {
    const customData = scope.customInstructionData.get(scope.instructionNode.name);
    const instructionParsedType = scope.nameApi.instructionParsedType(scope.instructionNode.name);
    const instructionDataName = scope.nameApi.instructionDataType(scope.instructionNode.name);

    const hasData = !!customData || scope.instructionNode.arguments.length > 0;
    const hasAccounts = scope.instructionNode.accounts.length > 0;

    const typeParamDeclarations = mergeFragments(
        [
            fragment`TProgram extends string = typeof ${scope.programAddressConstant}`,
            hasAccounts
                ? fragment`TAccountMetas extends readonly ${use('type AccountMeta', 'solanaInstructions')}[] = readonly AccountMeta[]`
                : undefined,
        ],
        cs => cs.join(', '),
    );

    const accounts = mergeFragments(
        scope.instructionNode.accounts.map((account, i) => {
            const docs = getDocblockFragment(account.docs ?? [], true);
            const name = camelCase(account.name);
            return fragment`${docs}${name}${account.isOptional ? '?' : ''}: TAccountMetas[${i}]${account.isOptional ? ' | undefined' : ''};`;
        }),
        cs => (hasAccounts ? `\naccounts: {\n${cs.join('\n')}\n};` : ''),
    );

    const dataTypeFragment = customData
        ? scope.dataArgsManifest.strictType
        : fragment`${scope.nameApi.dataType(instructionDataName)}`;
    const data = hasData ? fragment`\ndata: ${dataTypeFragment};` : fragment``;

    return fragment`export type ${instructionParsedType}<${typeParamDeclarations}> = { programAddress: ${use('type Address', 'solanaAddresses')}<TProgram>;${accounts}${data} };`;
}

function getFunctionFragment(
    scope: Pick<RenderScope, 'customInstructionData' | 'nameApi'> & {
        dataArgsManifest: TypeManifest;
        instructionNode: InstructionNode;
        programAddressConstant: Fragment;
    },
): Fragment {
    const customData = scope.customInstructionData.get(scope.instructionNode.name);
    const instructionParsedType = scope.nameApi.instructionParsedType(scope.instructionNode.name);
    const instructionParseFunction = scope.nameApi.instructionParseFunction(scope.instructionNode.name);
    const instructionDataName = scope.nameApi.instructionDataType(scope.instructionNode.name);
    const decoderFunction = customData
        ? scope.dataArgsManifest.decoder
        : fragment`${scope.nameApi.decoderFunction(instructionDataName)}()`;

    const hasData = !!customData || scope.instructionNode.arguments.length > 0;
    const hasAccounts = scope.instructionNode.accounts.length > 0;
    const hasOptionalAccounts = scope.instructionNode.accounts.some(account => account.isOptional);
    const minimumNumberOfAccounts =
        scope.instructionNode.optionalAccountStrategy === 'omitted'
            ? scope.instructionNode.accounts.filter(account => !account.isOptional).length
            : scope.instructionNode.accounts.length;

    const typeParams = ['TProgram', hasAccounts ? 'TAccountMetas' : undefined].filter(Boolean).join(', ');
    const typeParamDeclarations = mergeFragments(
        [
            fragment`TProgram extends string`,
            hasAccounts
                ? fragment`TAccountMetas extends readonly ${use('type AccountMeta', 'solanaInstructions')}[]`
                : undefined,
        ],
        cs => cs.join(', '),
    );

    const instructionType = mergeFragments(
        [
            fragment`${use('type Instruction', 'solanaInstructions')}<TProgram>`,
            hasAccounts
                ? fragment`${use('type InstructionWithAccounts', 'solanaInstructions')}<TAccountMetas>`
                : undefined,
            hasData
                ? pipe(
                      fragment`InstructionWithData<ReadonlyUint8Array>`,
                      f => addFragmentImports(f, 'solanaInstructions', ['type InstructionWithData']),
                      f => addFragmentImports(f, 'solanaCodecsCore', ['type ReadonlyUint8Array']),
                  )
                : undefined,
        ],
        cs => cs.join(' & '),
    );

    let accountHelpers: Fragment | undefined;
    if (hasAccounts) {
        accountHelpers = fragment`if (instruction.accounts.length < ${minimumNumberOfAccounts}) {
  // TODO: Coded error.
  throw new Error('Not enough accounts');
}
let accountIndex = 0;
const getNextAccount = () => {
  const accountMeta = (instruction.accounts as TAccountMetas)[accountIndex]!;
  accountIndex += 1;
  return accountMeta;
}`;
    }
    if (hasOptionalAccounts && scope.instructionNode.optionalAccountStrategy === 'omitted') {
        accountHelpers = fragment`${accountHelpers}
let optionalAccountsRemaining = instruction.accounts.length - ${minimumNumberOfAccounts};
const getNextOptionalAccount = () => {
  if (optionalAccountsRemaining === 0) return undefined;
  optionalAccountsRemaining -= 1;
  return getNextAccount();
};`;
    } else if (hasOptionalAccounts) {
        accountHelpers = fragment`${accountHelpers}
const getNextOptionalAccount = () => {
  const accountMeta = getNextAccount();
  return accountMeta.address === ${scope.programAddressConstant} ? undefined : accountMeta;
};`;
    }

    const accounts = mergeFragments(
        scope.instructionNode.accounts.map(account =>
            account.isOptional
                ? fragment`${camelCase(account.name)}: getNextOptionalAccount()`
                : fragment`${camelCase(account.name)}: getNextAccount()`,
        ),
        cs => (hasAccounts ? `, accounts: { ${cs.join(', ')} }` : ''),
    );

    const data = hasData ? fragment`, data: ${decoderFunction}.decode(instruction.data)` : fragment``;

    return fragment`export function ${instructionParseFunction}<${typeParamDeclarations}>(instruction: ${instructionType}): ${instructionParsedType}<${typeParams}> {
  ${accountHelpers}
  return { programAddress: instruction.programAddress${accounts}${data} };
}`;
}
