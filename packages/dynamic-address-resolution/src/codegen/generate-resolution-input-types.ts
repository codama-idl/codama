import { type DefinedTypeNode, type InstructionNode, type RootNode } from 'codama';

import { codamaTypeToTS } from './codama-type-to-ts';
import { getResolutionRefs } from './get-resolution-refs';
import { isAccountAutoResolvable } from './is-account-auto-resolvable';

/**
 * Emits the input types required for address resolution of each instruction:
 * `${Name}InstructionDataArgs` and `${Name}Accounts`, whose remaining accounts
 * are named account lists.
 */
export function generateResolutionInputTypes(idl: RootNode): string {
    const definedTypes = idl.program.definedTypes ?? [];
    return (idl.program.instructions ?? []).map(ix => generateTypeBlockForInstruction(ix, definedTypes)).join('');
}

function generateTypeBlockForInstruction(ix: InstructionNode, definedTypes: DefinedTypeNode[]): string {
    const refs = getResolutionRefs(ix, definedTypes);
    let output = '';

    if (refs.dataRef) {
        output += `export type ${refs.dataRef} = ${codamaTypeToTS(ix.data, definedTypes)};\n\n`;
    }

    const accounts = [
        ...(ix.accounts ?? []).map(account => {
            const omittable = isAccountAutoResolvable(account, ix) ? '?' : '';
            return `    ${account.identifier}${omittable}: ${account.isOptional ? 'Address | null' : 'Address'};\n`;
        }),
        ...(ix.remainingAccounts ?? []).map(
            remaining => `    ${remaining.identifier}${remaining.isOptional ? '?' : ''}: Address[];\n`,
        ),
    ];
    if (accounts.length > 0) {
        output += `export type ${refs.accountsRef} = {\n${accounts.join('')}};\n\n`;
        output += `export type ${refs.accountsWithDataRef} = ${refs.accountsRef} & Record<string, Address | null | undefined>;\n\n`;
    } else {
        // No IDL-declared accounts: emit the strict and loose forms independently.
        output += `export type ${refs.accountsRef} = Record<string, never>;\n\n`;
        output += `export type ${refs.accountsWithDataRef} = Record<string, Address | null | undefined>;\n\n`;
    }

    return output;
}
