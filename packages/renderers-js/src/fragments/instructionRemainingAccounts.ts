import {
    assertIsNode,
    camelCase,
    getAllInstructionArguments,
    InstructionNode,
    InstructionRemainingAccountsNode,
    isNode,
} from '@codama/nodes';
import { getLastNodeFromPath, NodePath, pipe } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { addFragmentFeatures, addFragmentImports, Fragment, fragment, mergeFragments } from '../utils';

export function getInstructionRemainingAccountsFragment(
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        instructionPath: NodePath<InstructionNode>;
        useAsync: boolean;
    },
): Fragment {
    const { remainingAccounts } = getLastNodeFromPath(scope.instructionPath);
    const fragments = (remainingAccounts ?? []).flatMap(a => getRemainingAccountsFragment(a, scope));
    if (fragments.length === 0) return fragment('');
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
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
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
    const nonSignerRole = isWritable ? 'AccountRole.WRITABLE' : 'AccountRole.READONLY';
    const signerRole = isWritable ? 'AccountRole.WRITABLE_SIGNER' : 'AccountRole.READONLY_SIGNER';
    const role = isSigner === true ? signerRole : nonSignerRole;
    const argumentArray = isOptional ? `(args.${argumentName} ?? [])` : `args.${argumentName}`;

    // The argument already exists or was added as `Array<Address>`.
    const allArguments = getAllInstructionArguments(instructionNode);
    const argumentExists = allArguments.some(arg => arg.name === remainingAccounts.value.name);
    if (argumentExists || isSigner === false) {
        return pipe(fragment(`${argumentArray}.map((address) => ({ address, role: ${role} }))`), f =>
            addFragmentImports(f, 'solanaInstructions', ['AccountRole']),
        );
    }

    // The argument was added as `Array<TransactionSigner | Address>`.
    if (isSigner === 'either') {
        return pipe(
            fragment(
                `${argumentArray}.map((addressOrSigner) => (` +
                    `isTransactionSigner(addressOrSigner)\n` +
                    `? { address: addressOrSigner.address, role: ${role}, signer: addressOrSigner }\n` +
                    `: { address: addressOrSigner, role: ${role} }\n` +
                    `))`,
            ),
            f => addFragmentImports(f, 'solanaInstructions', ['AccountRole']),
            f => addFragmentImports(f, 'shared', ['isTransactionSigner']),
        );
    }

    // The argument was added as `Array<TransactionSigner>`.
    return pipe(
        fragment(`${argumentArray}.map((signer) => ({ address: signer.address, role: ${signerRole}, signer }))`),
        f => addFragmentImports(f, 'solanaInstructions', ['AccountRole']),
    );
}

function getResolverValueNodeFragment(
    remainingAccounts: InstructionRemainingAccountsNode,
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        useAsync: boolean;
    },
): Fragment | null {
    assertIsNode(remainingAccounts.value, 'resolverValueNode');
    const isAsync = scope.asyncResolvers.includes(remainingAccounts.value.name);
    if (!scope.useAsync && isAsync) return null;

    const awaitKeyword = scope.useAsync && isAsync ? 'await ' : '';
    const functionName = scope.nameApi.resolverFunction(remainingAccounts.value.name);
    const module = scope.getImportFrom(remainingAccounts.value);
    return pipe(
        fragment(`${awaitKeyword}${functionName}(resolverScope)`),
        f => addFragmentImports(f, module, [functionName]),
        f => addFragmentFeatures(f, ['instruction:resolverScopeVariable']),
    );
}
