import { getLastNodeFromPath, isNode, type Node, type NodePath, type TypeNode } from 'codama';

import { resolveDisplayType } from './resolve-display-type';
import { resolveInjectedValue } from './resolve-injected-value';
import type { DisplayContext } from './types';

type BaseDisplayContext = Omit<DisplayContext, 'consumedMemberNames'>;

/**
 * Computes the set of member names (accounts or arguments) whose value was surfaced through the
 * provide/inject graph.
 *
 * A member is "consumed" when a `providedNode` that references it is injected into a display
 * value that actually resolves — e.g. a mint whose `decimals` were injected into an amount.
 * Such members back the `whenInjected` skip rule: they are hidden from the fallback list because
 * their value is already represented elsewhere.
 *
 * When the referenced provide cannot resolve (e.g. no `fetchAccount`), the member is not
 * consumed and remains visible — which is what distinguishes the metadata-rich and offline
 * fallback presentations.
 *
 * Accepts the context without `consumedMemberNames` so it can run before the full context exists.
 */
export async function resolveConsumedMemberNames(displayContext: BaseDisplayContext): Promise<Set<string>> {
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
 *
 * Mirrors what the fallback list actually renders (see `list-fallback.ts`): a struct argument's
 * fields are only surfaced when the argument opts into `flatten`, so we only descend into a struct
 * whose owner is flattened. Fields are rendered one level deep — a nested struct field is rendered
 * raw, never re-flattened — so we do not recurse past that level. Amount displays are the only ones
 * carrying injectable inputs (`decimals` and `unit`).
 */
function collectInjectedKeys(displayContext: BaseDisplayContext): Set<string> {
    const keys = new Set<string>();
    const instructionPath = displayContext.parsedInstruction.path;
    const instruction = getLastNodeFromPath(instructionPath);
    (instruction.arguments ?? []).forEach(argument => {
        collectMemberInjectedKeys(
            argument.type,
            argument.display?.flatten ?? false,
            [...instructionPath, argument],
            keys,
            displayContext,
        );
    });
    return keys;
}

/**
 * Collects injectable keys from a displayed member's type, following links. `ownerPath` locates the
 * type so nested links resolve against the correct program.
 *
 * When the member is rendered as an amount, its injectable inputs are collected. When it is a struct
 * that its owner flattened, its direct fields are surfaced individually, so amount inputs on those
 * fields are collected too — matching how the fallback list renders a flattened struct.
 */
function collectMemberInjectedKeys(
    type: TypeNode,
    flatten: boolean,
    ownerPath: NodePath,
    keys: Set<string>,
    displayContext: BaseDisplayContext,
): void {
    const resolved = resolveDisplayType(type, ownerPath, displayContext);
    if (isNode(resolved.type, 'numberTypeNode') && resolved.type.display?.kind === 'amountNumberDisplayNode') {
        addInjectedKey(resolved.type.display.decimals, keys);
        addInjectedKey(resolved.type.display.unit, keys);
    } else if (flatten && isNode(resolved.type, 'structTypeNode')) {
        (resolved.type.fields ?? []).forEach(field => {
            collectMemberInjectedKeys(field.type, false, [...resolved.ownerPath, field], keys, displayContext);
        });
    }
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
