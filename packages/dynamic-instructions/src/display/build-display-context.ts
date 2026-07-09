import { getNodeCodec } from '@codama/dynamic-codecs';
import type { ParsedInstruction } from '@codama/dynamic-parsers';
import {
    type AccountLinkNode,
    camelCase,
    getLastNodeFromPath,
    getRecordLinkablesVisitor,
    LinkableDictionary,
    type NodePath,
    type ProvidedNode,
    type RootNode,
    visit,
} from 'codama';

import { resolveConsumedMemberNames } from './resolve-consumed-members';
import type { DisplayContext, GetInstructionDisplayOptions, ResolveAccountDataFn } from './types';

/**
 * Assembles the {@link DisplayContext} for a parsed instruction.
 *
 * Threads the {@link ParsedInstruction} (the static node, decoded argument data, and concrete
 * account metas) and the root into the single context used by the display layer:
 * - `provides` indexes the instruction's `providedNode`s by the name they are exposed under;
 * - `resolveDefinedType` resolves `definedTypeLinkNode` paths against a `LinkableDictionary`
 *   built once from the root;
 * - `resolveAccountData` decodes a named account's raw bytes against its `accountLink` layout,
 *   resolved through the same dictionary;
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

    const provides = new Map<string, ProvidedNode>(
        (instruction.provides ?? []).map(provided => [provided.name, provided]),
    );

    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    const baseContext: Omit<DisplayContext, 'consumedMemberNames'> = {
        fetchAccount: options.fetchAccount,
        parsedInstruction,
        provides,
        resolveAccountData: createAccountDataResolver(parsedInstruction, linkables),
        resolveDefinedType: linkPath => linkables.getPath(linkPath),
    };

    return { ...baseContext, consumedMemberNames: await resolveConsumedMemberNames(baseContext) };
}

/**
 * Builds a {@link ResolveAccountDataFn} that decodes a named instruction account's raw bytes.
 *
 * Follows the instruction account's `accountLink` to the linked `AccountNode` — resolved through
 * the shared `LinkableDictionary`, so cross-program links resolve too — then decodes the bytes with
 * that account's codec. Returns `null` when the account is unknown, carries no `accountLink`, or the
 * link cannot be resolved.
 *
 * The link is resolved from a path rooted at the instruction (`[...parsedInstruction.path, link]`)
 * so the dictionary can supply the program context for links that omit an explicit program.
 */
function createAccountDataResolver(
    parsedInstruction: ParsedInstruction,
    linkables: LinkableDictionary,
): ResolveAccountDataFn {
    const instruction = getLastNodeFromPath(parsedInstruction.path);
    return (accountName, bytes) => {
        const target = camelCase(accountName);
        const instructionAccount = instruction.accounts.find(account => account.name === target);
        if (!instructionAccount?.accountLink) return null;

        const linkPath = [...parsedInstruction.path, instructionAccount.accountLink] as NodePath<AccountLinkNode>;
        const accountPath = linkables.getPath(linkPath);
        if (!accountPath) return null;

        return getNodeCodec(accountPath).decode(bytes) as Record<string, unknown>;
    };
}
