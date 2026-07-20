import { type InstructionNode, pascalCase } from 'codama';

import { OPTIONAL_NODE_KINDS } from '../shared/nodes';
import { collectResolverNames } from './collect-resolver-names';

/**
 * Symbol registry for the resolvable surface of an instruction.
 *
 * Returns the TypeScript identifier each codegen step in this package
 * (and downstream consumers) should reference when emitting types tied
 * to address resolution. `null` means "this symbol is not emitted for
 * this instruction" — callers pick their own fallback at the use site.
 *
 * Lives here because resolution rules decide which of these symbols exist.
 */
export type ResolutionRefs = {
    /** Identifier of the emitted `${Name}Accounts` type (strict, IDL-named keys only). */
    accountsRef: string;
    /**
     * Identifier of the emitted `${Name}AccountsWithData` type.
     * Widened with `Record<string, Address | null | undefined>`.
     */
    accountsWithDataRef: string;
    /** Identifier of the emitted `${Name}Args` type, or `null` if no args type is emitted. */
    argsRef: string | null;
    /** `true` when the instruction has any arguments (mirrors `argsRef !== null`). */
    hasArgs: boolean;
    /** `true` when at least one argument is non-optional. */
    hasRequiredArgs: boolean;
    /** `true` when at least one remaining-account argument is non-optional. */
    hasRequiredRemainingAccounts: boolean;
    /** `true` when the instruction has any custom resolvers (mirrors `resolversRef !== null`). */
    hasResolvers: boolean;
    /** Identifier of the emitted `${Name}Resolvers` type, or `null` if no resolvers type is emitted. */
    resolversRef: string | null;
};

export function getResolutionRefs(ix: InstructionNode): ResolutionRefs {
    const typeName = pascalCase(ix.name);

    const args = (ix.arguments ?? []).filter(arg => arg.defaultValueStrategy !== 'omitted');
    const remainingAccountArgs = (ix.remainingAccounts ?? []).filter(ra => ra.value.kind === 'argumentValueNode');
    const hasArgs = args.length > 0 || remainingAccountArgs.length > 0;
    const hasRequiredArgs = args.some(arg => !OPTIONAL_NODE_KINDS.includes(arg.type.kind));
    const hasRequiredRemainingAccounts = remainingAccountArgs.some(ra => !ra.isOptional);

    const hasResolvers = collectResolverNames(ix).size > 0;

    return {
        accountsRef: `${typeName}Accounts`,
        accountsWithDataRef: `${typeName}AccountsWithData`,
        argsRef: hasArgs ? `${typeName}Args` : null,
        hasArgs,
        hasRequiredArgs,
        hasRequiredRemainingAccounts,
        hasResolvers,
        resolversRef: hasResolvers ? `${typeName}Resolvers` : null,
    };
}
