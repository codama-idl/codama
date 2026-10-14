import { type ParsableInstruction, type ParsedInstruction, parseInstruction } from '@codama/dynamic-parsers';
import { getLinkablesFromNode, type RootNode } from 'codama';

import { createAccountReader } from './accounts';
import { getDisplayAccountMap } from './dictionary';
import { displayInstruction } from './display-instruction';
import type { FetchMaybeAccountsFn, GetInstructionDisplayOptions, InstructionDisplay } from './types';

/**
 * Present an instruction to humans, e.g. to clear sign it: parse it, fetch the accounts its
 * display reads with `fetchAccounts`, if given, then present it as
 * {@link getInstructionDisplayFromParsedInstruction} does. Returns `null` when the instruction
 * cannot be parsed, e.g. because it belongs to another program.
 *
 * @example
 * ```ts
 * const display = await getInstructionDisplay(root, instruction, {
 *     fetchAccounts: addresses => fetchEncodedAccounts(rpc, addresses),
 *     formatAddress: address => names.get(address) ?? address,
 * });
 * ```
 */
export async function getInstructionDisplay(
    root: RootNode,
    instruction: ParsableInstruction,
    options: GetInstructionDisplayOptions & { readonly fetchAccounts?: FetchMaybeAccountsFn } = {},
): Promise<InstructionDisplay | null> {
    const { fetchAccounts, ...displayOptions } = options;
    const linkables = displayOptions.linkables ?? getLinkablesFromNode(root);
    const parsed = parseInstruction(root, instruction, { linkables });
    if (!parsed) return null;
    const accounts = fetchAccounts
        ? await getDisplayAccountMap(root, parsed, fetchAccounts, { accounts: displayOptions.accounts, linkables })
        : displayOptions.accounts;
    return getInstructionDisplayFromParsedInstruction(root, parsed, { ...displayOptions, accounts, linkables });
}

/**
 * Present a parsed instruction to humans, e.g. to clear sign it: its intent, its interpolated
 * intent and the rows of its fallback list. Values are formatted with the formatters of
 * `@codama/dynamic-codecs`, whose options it accepts, and injected values of display nodes, e.g.
 * the `decimals` of an amount, resolve from the `provides` of the instruction. Values read from
 * accounts, e.g. the `decimals` of a mint, come from the `accounts` option, e.g. fetched with
 * `getDisplayAccountMap`.
 *
 * Amounts whose decimals cannot be resolved are written as their raw value followed by `(raw)`
 * in the rows, so they cannot be mistaken for scaled amounts, and make the interpolated intent
 * `null`.
 *
 * @example
 * ```ts
 * const parsed = parseInstruction(root, instruction);
 * const display = parsed && getInstructionDisplayFromParsedInstruction(root, parsed, {
 *     accounts,
 *     formatAddress: address => names.get(address) ?? address,
 * });
 * // { intent: 'Transfer', interpolatedIntent: 'Transfer 1.5 USDC to Alice', fields: [{ label: 'Amount', value: '1.5 USDC' }, …] }
 * ```
 */
export function getInstructionDisplayFromParsedInstruction(
    root: RootNode,
    parsed: ParsedInstruction,
    options: GetInstructionDisplayOptions = {},
): InstructionDisplay {
    const { accounts = new Map(), linkables = getLinkablesFromNode(root), ...formatOptions } = options;
    return displayInstruction({
        formatOptions,
        linkables,
        parsed,
        readAccount: createAccountReader(accounts, linkables),
    });
}
