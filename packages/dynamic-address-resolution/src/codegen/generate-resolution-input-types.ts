import {
    getLastNodeFromPath,
    getLinkablesFromNode,
    type InstructionNode,
    type LinkableDictionary,
    type NodePath,
    type RootNode,
} from 'codama';

import { codamaTypeToTS } from './codama-type-to-ts';
import { getResolutionRefs } from './get-resolution-refs';
import { isAccountAutoResolvable } from './is-account-auto-resolvable';

/**
 * Emits the input types required for address resolution of each instruction:
 * `${Name}InstructionDataArgs` and `${Name}Accounts`, whose remaining accounts
 * are named account lists. Recursive data types are referenced by the aliases
 * `generateDefinedTypes` emits.
 */
export function generateResolutionInputTypes(idl: RootNode): string {
    const linkables = getLinkablesFromNode(idl);
    return (idl.program.instructions ?? [])
        .map(ix => generateTypeBlockForInstruction([idl, idl.program, ix], linkables))
        .join('');
}

function generateTypeBlockForInstruction(path: NodePath<InstructionNode>, linkables: LinkableDictionary): string {
    const ix = getLastNodeFromPath(path);
    const refs = getResolutionRefs(path, linkables);
    let output = '';

    if (refs.dataRef && ix.data) {
        output += `export type ${refs.dataRef} = ${codamaTypeToTS([...path, ix.data], linkables)};\n\n`;
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
