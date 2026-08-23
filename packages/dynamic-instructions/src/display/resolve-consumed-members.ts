import { isNode, type Node } from 'codama';

import { collectInjectedNodes } from './collect-injected-nodes';
import { resolveInjectedValue } from './resolve-injected-value';
import { resolveInjectionTarget } from './resolve-injection-target';
import type { DisplayContext } from './types';

type BaseDisplayContext = Omit<DisplayContext, 'consumedMemberNames'>;

/**
 * Computes the set of member names (accounts or arguments) whose value was surfaced through the
 * provide/inject graph.
 *
 * A member is "consumed" when a display value injects it and that injection actually resolves — e.g.
 * a mint whose `decimals` were injected into an amount. Such members back the `whenInjected` skip
 * rule: they are hidden from the fallback list because their value is already represented elsewhere.
 *
 * Two independent gates must both hold for a member to count as consumed:
 * - *rendered*: the injection point is actually displayed (see {@link collectInjectedNodes}, which
 *   is flatten-aware — an amount buried in a non-flattened struct is never surfaced);
 * - *resolved*: the injection resolves to a concrete value. When it cannot (e.g. no `fetchAccount`
 *   offline, or the account does not exist), the member is not consumed and remains visible — which
 *   is what distinguishes the metadata-rich and offline fallback presentations.
 *
 * Selection follows the provide/inject protocol via {@link resolveInjectionTarget} (a matching
 * provider wins, else the injection's own `fallback`), so members reachable only through a fallback
 * are handled too. Cyclic provider chains resolve to nothing rather than recursing forever. Distinct
 * targets are resolved once, so the same display value injected into several slots is fetched once.
 *
 * Accepts the context without `consumedMemberNames` so it can run before the full context exists.
 */
export async function resolveConsumedMemberNames(displayContext: BaseDisplayContext): Promise<Set<string>> {
    // Select each rendered injection to its terminal node (provider → fallback → chain,
    // cycle-guarded), then deduplicate by the resolved target — not the injection key — so the same
    // display value appearing in several slots is resolved (and fetched) only once, while two slots
    // that share a key but resolve to different targets are both kept.
    const targets = new Set(
        collectInjectedNodes(displayContext)
            .map(node => resolveInjectionTarget(node, displayContext.provides))
            .filter((target): target is Node => target !== null),
    );

    const consumedNodes = await Promise.all(
        [...targets].map(async target => {
            // Resolution gate: the terminal must resolve to a concrete value. The target is never an
            // `injectedValueNode` (the walk already collapsed the chain), so resolving it cannot
            // re-enter the graph or cycle.
            const value = await resolveInjectedValue(target, displayContext);
            return value === null ? null : target;
        }),
    );

    const consumed = new Set<string>();
    consumedNodes.forEach(node => {
        if (node) collectReferencedMembers(node, consumed);
    });
    return consumed;
}

/** Collects the member names a resolved value node references (an account, its field, or an argument). */
function collectReferencedMembers(node: Node, members: Set<string>): void {
    if (isNode(node, 'accountValueNode')) members.add(node.name);
    else if (isNode(node, 'accountFieldValueNode')) members.add(node.account);
    else if (isNode(node, 'argumentValueNode')) members.add(node.name);
}
