import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { Address } from '@solana/addresses';
import { findProgramNodeFromPath, getLastNodeFromPath, parseOptionalAccountStrategy } from 'codama';

/**
 * The address of a named account of a parsed instruction, or `undefined` when it is omitted.
 *
 * Optional accounts are omitted either by leaving them out, with the `omitted` strategy, or by
 * passing the address of the program, with the `programId` strategy, the default. The parser
 * keeps that address in the slot, so it is treated as omitted here, rather than presented as a
 * real account.
 */
export function getAccountAddress(parsed: ParsedInstruction, identifier: string): Address | undefined {
    const address = parsed.accounts.find(account => account.identifier === identifier)?.address;
    if (address === undefined) return undefined;
    const instruction = getLastNodeFromPath(parsed.path);
    const account = (instruction.accounts ?? []).find(account => account.identifier === identifier);
    if (!account?.isOptional || parseOptionalAccountStrategy(instruction.optionalAccountStrategy) !== 'programId') {
        return address;
    }
    return address === findProgramNodeFromPath(parsed.path)?.publicKey ? undefined : address;
}
