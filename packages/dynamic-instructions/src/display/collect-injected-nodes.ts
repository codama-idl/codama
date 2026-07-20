import { getLastNodeFromPath, type InjectedValueNode, isNode, type Node, type NodePath, type TypeNode } from 'codama';

import { resolveDisplayType } from './resolve-display-type';
import type { DisplayContext } from './types';

type BaseDisplayContext = Omit<DisplayContext, 'consumedMemberNames'>;

/**
 * Collects the `injectedValueNode`s requested by the instruction's argument displays, mirroring
 * what the fallback list renders (see `list-fallback.ts`). A purely static walk shared by the
 * consumed-member computation and the offline-dictionary planner so they agree on which injections
 * exist. Nodes are returned (rather than bare keys) so callers can reach each injection's `fallback`.
 */
export function collectInjectedNodes(displayContext: BaseDisplayContext): InjectedValueNode[] {
    const instructionPath = displayContext.parsedInstruction.path;
    const instruction = getLastNodeFromPath(instructionPath);
    return (instruction.arguments ?? []).flatMap(argument =>
        collectMemberInjectedNodes(
            argument.type,
            argument.display?.flatten ?? false,
            [...instructionPath, argument],
            displayContext,
        ),
    );
}

// Amount displays carry the injectable inputs; a flattened struct surfaces its direct fields, so we
// recurse one level into those. `ownerPath` locates the type so nested links resolve in the right program.
function collectMemberInjectedNodes(
    type: TypeNode,
    flatten: boolean,
    ownerPath: NodePath,
    displayContext: BaseDisplayContext,
): InjectedValueNode[] {
    const resolved = resolveDisplayType(type, ownerPath, displayContext);
    if (isNode(resolved.type, 'numberTypeNode') && resolved.type.display?.kind === 'amountNumberDisplayNode') {
        return [resolved.type.display.decimals, resolved.type.display.unit].filter(isInjectedValueNode);
    }
    if (flatten && isNode(resolved.type, 'structTypeNode')) {
        return (resolved.type.fields ?? []).flatMap(field =>
            collectMemberInjectedNodes(field.type, false, [...resolved.ownerPath, field], displayContext),
        );
    }
    return [];
}

/** Narrows an optional injectable input to an `injectedValueNode`. */
function isInjectedValueNode(input: Node | undefined): input is InjectedValueNode {
    return input !== undefined && isNode(input, 'injectedValueNode');
}
