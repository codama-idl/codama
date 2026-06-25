import type { Account } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import { isNode, type Node } from 'codama';

import { isObjectRecord } from '../shared/util';
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
 * - `accountValueNode`: the referenced account's address.
 * - `accountFieldValueNode`: a field of the referenced account's decoded data, fetched via
 *   `fetchAccountData`.
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

    if (isNode(node, 'accountValueNode')) {
        return context.accountAddresses.get(node.name) ?? null;
    }

    if (isNode(node, 'accountFieldValueNode')) {
        const address = context.accountAddresses.get(node.account);
        if (!address || !context.fetchAccountData) return null;
        const account = await context.fetchAccountData(address);
        if (!account) return null;
        return readAccountField(account, node.path);
    }

    return null;
}

/**
 * Reads a named field from a decoded account's data.
 * A path is required: the whole decoded struct is not a single displayable scalar, so a
 * path-less reference yields `null`. Also returns `null` when the data is not a record, or
 * when the field is absent or not a primitive value.
 */
function readAccountField(account: Account<object>, path: string | undefined): ResolvedDisplayValue {
    if (path === undefined) return null;
    if (!isObjectRecord(account.data)) return null;
    return toResolvedValue(account.data[path]);
}

/** Narrows an unknown decoded value to the primitive shapes the display layer can render. */
function toResolvedValue(value: unknown): ResolvedDisplayValue {
    if (typeof value === 'bigint' || typeof value === 'number' || typeof value === 'string') {
        return value;
    }
    return null;
}
