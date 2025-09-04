import {
    assertIsNode,
    camelCase,
    getAllInstructionArguments,
    InstructionNode,
    InstructionRemainingAccountsNode,
    isNode,
} from '@codama/nodes';
import { getLastNodeFromPath, NodePath, pipe } from '@codama/visitors-core';

import {
    addFragmentFeatures,
    addFragmentImports,
    Fragment,
    fragment,
    mergeFragments,
    RenderScope,
    use,
} from '../utils';

export function getInstructionRemainingAccountsFragment(
    scope: Pick<RenderScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        instructionPath: NodePath<InstructionNode>;
        useAsync: boolean;
    },
): Fragment | undefined {
    const { remainingAccounts } = getLastNodeFromPath(scope.instructionPath);
    const fragments = (remainingAccounts ?? []).flatMap(a => getRemainingAccountsFragment(a, scope));
    if (fragments.length === 0) return;
    return pipe(
        mergeFragments(
            fragments,
            c =>
                `// Remaining accounts.\n` +
                `const remainingAccounts: AccountMeta[] = ${c.length === 1 ? c[0] : `[...${c.join(', ...')}]`}`,
        ),
        f => addFragmentImports(f, 'solanaInstructions', ['type AccountMeta']),
    );
}

function getRemainingAccountsFragment(
    remainingAccounts: InstructionRemainingAccountsNode,
    scope: Pick<RenderScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        instructionPath: NodePath<InstructionNode>;
        useAsync: boolean;
    },
): Fragment[] {
    const remainingAccountsFragment = ((): Fragment | null => {
        if (isNode(remainingAccounts.value, 'argumentValueNode')) {
            return getArgumentValueNodeFragment(remainingAccounts, scope);
        }
        if (isNode(remainingAccounts.value, 'resolverValueNode')) {
            return getResolverValueNodeFragment(remainingAccounts, scope);
        }
        return null;
    })();

    if (remainingAccountsFragment === null) return [];
    return [remainingAccountsFragment];
}

function getArgumentValueNodeFragment(
    remainingAccounts: InstructionRemainingAccountsNode,
    scope: { instructionPath: NodePath<InstructionNode> },
): Fragment {
    const instructionNode = getLastNodeFromPath(scope.instructionPath);
    assertIsNode(remainingAccounts.value, 'argumentValueNode');
    const argumentName = camelCase(remainingAccounts.value.name);
    const isOptional = remainingAccounts.isOptional ?? false;
    const isSigner = remainingAccounts.isSigner ?? false;
    const isWritable = remainingAccounts.isWritable ?? false;
    const accountRole = use('AccountRole', 'solanaInstructions');
    const nonSignerRole = isWritable ? fragment`${accountRole}.WRITABLE` : fragment`${accountRole}.READONLY`;
    const signerRole = isWritable ? fragment`${accountRole}.WRITABLE_SIGNER` : fragment`${accountRole}.READONLY_SIGNER`;
    const role = isSigner === true ? signerRole : nonSignerRole;
    const argumentArray = isOptional ? `(args.${argumentName} ?? [])` : `args.${argumentName}`;

    // The argument already exists or was added as `Array<Address>`.
    const allArguments = getAllInstructionArguments(instructionNode);
    const argumentExists = allArguments.some(arg => arg.name === remainingAccounts.value.name);
    if (argumentExists || isSigner === false) {
        return fragment`${argumentArray}.map((address) => ({ address, role: ${role} }))`;
    }

    // The argument was added as `Array<TransactionSigner | Address>`.
    if (isSigner === 'either') {
        return fragment`${argumentArray}.map((addressOrSigner) => (${use('isTransactionSigner', 'shared')}(addressOrSigner) ? { address: addressOrSigner.address, role: ${role}, signer: addressOrSigner } : { address: addressOrSigner, role: ${role} }))`;
    }

    // The argument was added as `Array<TransactionSigner>`.
    return fragment`${argumentArray}.map((signer) => ({ address: signer.address, role: ${signerRole}, signer }))`;
}

function getResolverValueNodeFragment(
    remainingAccounts: InstructionRemainingAccountsNode,
    scope: Pick<RenderScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        useAsync: boolean;
    },
): Fragment | null {
    assertIsNode(remainingAccounts.value, 'resolverValueNode');
    const isAsync = scope.asyncResolvers.includes(remainingAccounts.value.name);
    if (!scope.useAsync && isAsync) return null;

    const awaitKeyword = scope.useAsync && isAsync ? 'await ' : '';
    const functionName = use(
        scope.nameApi.resolverFunction(remainingAccounts.value.name),
        scope.getImportFrom(remainingAccounts.value),
    );
    return pipe(fragment`${awaitKeyword}${functionName}(resolverScope)`, f =>
        addFragmentFeatures(f, ['instruction:resolverScopeVariable']),
    );
}
