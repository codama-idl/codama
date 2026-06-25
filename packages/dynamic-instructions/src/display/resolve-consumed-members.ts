import { getLastNodeFromPath, isNode, type Node } from 'codama';

import { resolveDisplayType } from './format-argument-value';
import { resolveInjectedValue } from './resolve-injected-value';
import type { DisplayContext } from './types';

/**
 * Computes the set of member names (accounts or arguments) whose value was surfaced through the
 * provide/inject graph.
 *
 * A member is "consumed" when a `providedNode` that references it is injected into a display
 * value that actually resolves — e.g. a mint whose `decimals` were injected into an amount.
 * Such members back the `whenInjected` skip rule: they are hidden from the fallback list because
 * their value is already represented elsewhere.
 *
 * When the referenced provide cannot resolve (e.g. no `fetchAccountData`), the member is not
 * consumed and remains visible — which is what distinguishes the metadata-rich and offline
 * fallback presentations.
 *
 * Accepts the context without `consumedMemberNames` so it can run before the full context exists.
 */
export async function resolveConsumedMemberNames(
    displayContext: Omit<DisplayContext, 'consumedMemberNames'>,
): Promise<Set<string>> {
    const injectedKeys = collectInjectedKeys(displayContext);

    const consumedNodes = await Promise.all(
        [...injectedKeys].map(async key => {
            const provided = displayContext.provides.get(key);
            if (!provided) return null;
            const value = await resolveInjectedValue(provided.node, displayContext);
            return value === null ? null : provided.node;
        }),
    );

    const consumed = new Set<string>();
    consumedNodes.forEach(node => {
        if (node) collectReferencedMembers(node, consumed);
    });
    return consumed;
}

/**
 * Collects the keys requested by `injectedValueNode`s in the instruction's argument displays.
 * Amount displays are the only ones carrying injectable inputs (`decimals` and `unit`).
 */
function collectInjectedKeys(displayContext: Omit<DisplayContext, 'consumedMemberNames'>): Set<string> {
    const keys = new Set<string>();
    const instruction = getLastNodeFromPath(displayContext.instructionPath);
    instruction.arguments.forEach(argument => {
        const { type } = resolveDisplayType(
            argument.type,
            [...displayContext.instructionPath, argument],
            displayContext,
        );
        if (isNode(type, 'numberTypeNode') && type.display?.kind === 'amountNumberDisplayNode') {
            addInjectedKey(type.display.decimals, keys);
            addInjectedKey(type.display.unit, keys);
        }
    });
    return keys;
}

/** Adds an injectable input's key to the set when it is an `injectedValueNode`. */
function addInjectedKey(input: Node | undefined, keys: Set<string>): void {
    if (input && isNode(input, 'injectedValueNode')) keys.add(input.key);
}

/** Collects the member names a provided value node references (an account, its field, or an argument). */
function collectReferencedMembers(node: Node, members: Set<string>): void {
    if (isNode(node, 'accountValueNode')) members.add(node.name);
    else if (isNode(node, 'accountFieldValueNode')) members.add(node.account);
    else if (isNode(node, 'argumentValueNode')) members.add(node.name);
}
