import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { Address } from '@solana/addresses';
import {
    getLastNodeFromPath,
    getRecordLinkablesVisitor,
    LinkableDictionary,
    type ProvidedNode,
    type RootNode,
    visit,
} from 'codama';

import { resolveConsumedMemberNames } from './resolve-consumed-members';
import type { DisplayContext, GetInstructionDisplayOptions, ResolveDefinedTypeFn } from './types';

/**
 * Assembles the {@link DisplayContext} for a parsed instruction.
 *
 * Bridges a {@link ParsedInstruction} (the static node, decoded argument data, and concrete
 * account metas) and the root into the single context threaded through the display layer:
 * - `accountAddresses` maps each account name to its concrete address;
 * - `provides` indexes the instruction's `providedNode`s by the name they are exposed under;
 * - `resolveDefinedType` resolves `definedTypeLinkNode` paths against a `LinkableDictionary`
 *   built once from the root;
 * - `consumedMemberNames` records which members were surfaced through the provide/inject graph.
 *
 * Resolving consumed members reads account state, so this function is asynchronous.
 */
export async function buildDisplayContext(
    root: RootNode,
    parsedInstruction: ParsedInstruction,
    options: GetInstructionDisplayOptions = {},
): Promise<DisplayContext> {
    const instruction = getLastNodeFromPath(parsedInstruction.path);

    const accountAddresses = new Map<string, Address>(
        parsedInstruction.accounts.map(account => [account.name, account.address]),
    );

    const provides = new Map<string, ProvidedNode>(
        (instruction.provides ?? []).map(provided => [provided.name, provided]),
    );

    const baseContext: Omit<DisplayContext, 'consumedMemberNames'> = {
        accountAddresses,
        data: parsedInstruction.data as Record<string, unknown>,
        fetchAccountData: options.fetchAccountData,
        instructionPath: parsedInstruction.path,
        provides,
        resolveDefinedType: createDefinedTypeResolver(root),
    };

    return { ...baseContext, consumedMemberNames: await resolveConsumedMemberNames(baseContext) };
}

/**
 * Builds a {@link ResolveDefinedTypeFn} backed by a `LinkableDictionary` populated from the root.
 * The caller supplies the full path to the link, which carries the program context the dictionary
 * needs — including for links reached after following other links.
 */
function createDefinedTypeResolver(root: RootNode): ResolveDefinedTypeFn {
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));
    return linkPath => linkables.getPath(linkPath);
}
