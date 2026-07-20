import { type DefinedTypeNode, type InstructionNode, type RootNode } from 'codama';

import { OPTIONAL_NODE_KINDS } from '../shared/nodes';
import { codamaTypeToTS } from './codama-type-to-ts';
import { collectResolverNames } from './collect-resolver-names';
import { getResolutionRefs } from './get-resolution-refs';
import { isAccountAutoResolvable } from './is-account-auto-resolvable';

/**
 * Local non-exported declaration of `ResolverFn` emitted into generated files
 * that contain at least one `${Name}Resolvers` block. The structural shape
 * must remain identical to the runtime `ResolverFn` exported from
 * `@codama/dynamic-address-resolution`; a type-level test in this package
 * locks the two together.
 *
 * @internal Exported only for a drift test that pins this string to the
 * runtime `ResolverFn` type. Do not consume from downstream codegen — call
 * `generateResolutionInputTypes` instead, which inlines this declaration
 * into the emitted output.
 */
export const RESOLVER_FN_DECLARATION =
    'type ResolverFn<TArgumentsInput, TAccountsInput> = (argumentsInput: TArgumentsInput, accountsInput: TAccountsInput) => Promise<unknown>;\n\n';

/**
 * Emits the input types required for address resolution of each instruction —
 * `${Name}Args`, `${Name}Accounts`, `${Name}Resolvers`.
 *
 * These types live in this package because address resolution
 * (PDAs, defaults, resolver functions) operates on them.
 */
export function generateResolutionInputTypes(idl: RootNode): string {
    const definedTypes = idl.program.definedTypes ?? [];
    const hasAnyResolvers = (idl.program.instructions ?? []).some(ix => getResolutionRefs(ix).hasResolvers);
    let output = hasAnyResolvers ? RESOLVER_FN_DECLARATION : '';
    for (const ix of idl.program.instructions ?? []) {
        output += generateTypeBlockForInstruction(ix, definedTypes);
    }
    return output;
}

function generateTypeBlockForInstruction(ix: InstructionNode, definedTypes: DefinedTypeNode[]): string {
    const refs = getResolutionRefs(ix);
    let output = '';

    if (refs.argsRef) {
        const args = (ix.arguments ?? []).filter(arg => arg.defaultValueStrategy !== 'omitted');
        const remainingAccountArgs = (ix.remainingAccounts ?? []).filter(ra => ra.value.kind === 'argumentValueNode');
        output += `export type ${refs.argsRef} = {\n`;
        for (const arg of args) {
            const tsType = codamaTypeToTS(arg.type, definedTypes);
            const isOptional = OPTIONAL_NODE_KINDS.includes(arg.type.kind);
            const sep = isOptional ? '?:' : ':';
            output += `    ${arg.name}${sep} ${tsType};\n`;
        }
        for (const ra of remainingAccountArgs) {
            const sep = ra.isOptional ? '?:' : ':';
            output += `    ${ra.value.name}${sep} Address[];\n`;
        }
        output += '};\n\n';
    }

    if ((ix.accounts ?? []).length > 0) {
        output += `export type ${refs.accountsRef} = {\n`;
        for (const acc of ix.accounts ?? []) {
            const omittable = isAccountAutoResolvable(acc) ? '?' : '';
            const type = acc.isOptional ? 'Address | null' : 'Address';
            output += `    ${acc.name}${omittable}: ${type};\n`;
        }
        output += '};\n\n';
        output += `export type ${refs.accountsWithDataRef} = ${refs.accountsRef} & Record<string, Address | null | undefined>;\n\n`;
    } else {
        // No IDL-declared accounts: emit the strict and loose forms independently.
        output += `export type ${refs.accountsRef} = Record<string, never>;\n\n`;
        output += `export type ${refs.accountsWithDataRef} = Record<string, Address | null | undefined>;\n\n`;
    }

    if (refs.resolversRef) {
        const resolverArgsRef = refs.argsRef ?? 'Record<string, unknown>';
        output += `export type ${refs.resolversRef} = {\n`;
        for (const name of collectResolverNames(ix)) {
            output += `    ${name}: ResolverFn<${resolverArgsRef}, ${refs.accountsRef}>;\n`;
        }
        output += '};\n\n';
    }

    return output;
}
