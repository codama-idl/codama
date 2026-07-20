import { isNode, type Node, type ProvidedNode } from 'codama';

/**
 * Resolves a value node to the terminal node the provide/inject protocol selects, following the
 * graph statically without evaluating it.
 *
 * The protocol is pure selection: for an `injectedValueNode`, if the `provides` map supplies its
 * key, that provider's node is chosen (the injection's own `fallback` is ignored); otherwise the
 * `fallback` is chosen; otherwise the key is unsatisfied and resolves to `null`. A chosen node that
 * is itself an `injectedValueNode` is followed in turn, so provider chains collapse to their
 * terminal. Any non-injection node (e.g. `accountFieldValueNode`, `accountValueNode`,
 * `argumentValueNode`, `numberValueNode`) is already terminal and returned as-is.
 *
 * Resolution is against a single, pre-assembled `provides` map. Deciding which provider wins for a
 * given key is the caller's responsibility: today the map is built from the one instruction being
 * displayed, but were several provider scopes ever merged (e.g. nested instructions where the
 * closest ancestor should override), the caller must resolve that precedence when building the map.
 * This walk simply trusts `provides.get(key)`.
 *
 * This is deliberately *not* a tree rewrite: the terminal is returned rather than spliced back into
 * its slot, because display slots are statically typed (e.g. an amount's `decimals` accepts only
 * `numberValueNode | injectedValueNode`) yet an injection routinely resolves to an
 * `accountFieldValueNode`, which no such slot can hold. Callers interpret the terminal themselves —
 * the offline planner reads the addresses it references, the consumed-member computation resolves
 * and gates it — so both agree on what an injection resolves to without duplicating the walk.
 *
 * Provider chains may cycle (a provider re-injecting its own key); `seen` tracks the keys already
 * visited so such a cycle terminates at `null` rather than recursing forever.
 *
 * @param node - The value node to resolve; typically an `injectedValueNode` from a display slot.
 * @param provides - The assembled providers in scope, indexed by the key they expose; the caller
 *   must have already resolved any duplicate keys to the winning provider.
 * @returns The selected terminal node, or `null` when the injection cannot be satisfied.
 */
export function resolveInjectionTarget(
    node: Node,
    provides: ReadonlyMap<string, ProvidedNode>,
    seen: ReadonlySet<string> = new Set(),
): Node | null {
    if (!isNode(node, 'injectedValueNode')) return node;
    if (seen.has(node.key)) return null;
    const nextSeen = new Set([...seen, node.key]);
    const provided = provides.get(node.key)?.node;
    if (provided) return resolveInjectionTarget(provided, provides, nextSeen);
    if (node.fallback) return resolveInjectionTarget(node.fallback, provides, nextSeen);
    return null;
}
