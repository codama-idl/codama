import type { Address } from '@solana/addresses';
import { isNode, type Node } from 'codama';

import type { DisplayContext } from './types';

/**
 * A value resolved from the provide/inject graph for display purposes.
 *
 * `number` and `string` come from literal value nodes or account fields; `Address` comes from
 * an `accountValueNode` reference. `null` means the value could not be resolved (no provider,
 * no fallback, or missing account data) and the caller should degrade gracefully.
 */
export type ResolvedDisplayValue = Address | bigint | number | string | null;

/**
 * Resolves a node to a concrete display value within a {@link DisplayContext}.
 *
 * Handles the value/contextual nodes the display layer relies on:
 * - `numberValueNode` / `stringValueNode`: the literal value.
 * - `injectedValueNode`: looks the key up in `provides`, resolving the matched provider's node;
 *   when no provider supplies the key, falls back to the injection's own `fallback`.
 * - `argumentValueNode`: the decoded value of the referenced instruction argument.
 * - `accountValueNode`: the referenced account's address.
 * - `accountFieldValueNode`: a field of the referenced account's data — the account is fetched via
 *   `fetchAccount`, then its bytes decoded against the account's `accountLink` via
 *   `resolveAccountData`.
 *
 * Returns `null` when the value cannot be resolved so callers can fall back safely.
 */
export async function resolveInjectedValue(
    node: Node,
    context: Omit<DisplayContext, 'consumedMemberNames'>,
): Promise<ResolvedDisplayValue> {
    if (isNode(node, 'numberValueNode')) {
        return node.number;
    }

    if (isNode(node, 'stringValueNode')) {
        return node.string;
    }

    if (isNode(node, 'injectedValueNode')) {
        const provided = context.provides.get(node.key);
        if (provided) {
            return await resolveInjectedValue(provided.node, context);
        }
        if (node.fallback) {
            return await resolveInjectedValue(node.fallback, context);
        }
        return null;
    }

    if (isNode(node, 'argumentValueNode')) {
        const data = context.parsedInstruction.data as Record<string, unknown>;
        return toResolvedValue(data[node.name]);
    }

    if (isNode(node, 'accountValueNode')) {
        return findAccountAddress(context, node.name);
    }

    if (isNode(node, 'accountFieldValueNode')) {
        const address = findAccountAddress(context, node.account);
        if (!address || !context.fetchAccount) return null;
        const account = await context.fetchAccount(address);
        if (!account.exists) return null;
        const data = context.resolveAccountData(node.account, account.data);
        return readAccountField(data, node.path);
    }

    return null;
}

/** Finds the concrete address of a named account of the surrounding instruction, or `null`. */
function findAccountAddress(context: Omit<DisplayContext, 'consumedMemberNames'>, name: string): Address | null {
    return context.parsedInstruction.accounts.find(account => account.name === name)?.address ?? null;
}

/**
 * Reads a named field from a decoded account's data.
 * A path is required: the whole decoded struct is not a single displayable scalar, so a
 * path-less reference yields `null`. Also returns `null` when the data could not be decoded, or
 * when the field is absent or not a primitive value.
 */
function readAccountField(data: Record<string, unknown> | null, path: string | undefined): ResolvedDisplayValue {
    if (data === null || path === undefined) return null;
    return toResolvedValue(data[path]);
}

/** Narrows an unknown decoded value to the primitive shapes the display layer can render. */
function toResolvedValue(value: unknown): ResolvedDisplayValue {
    if (typeof value === 'bigint' || typeof value === 'number' || typeof value === 'string') {
        return value;
    }
    return null;
}
