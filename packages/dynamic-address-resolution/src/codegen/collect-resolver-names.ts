import type { InstructionInputValueNode, InstructionNode } from 'codama';

/**
 * Collects all unique resolverValueNode names from an instruction's accounts and arguments.
 */
export function collectResolverNames(ix: InstructionNode): Set<string> {
    const names = new Set<string>();

    for (const acc of ix.accounts ?? []) {
        extractResolverNodeName(acc.defaultValue, names);
    }
    for (const arg of ix.arguments ?? []) {
        extractResolverNodeName(arg.defaultValue, names);
    }

    return names;
}

function extractResolverNodeName(node: InstructionInputValueNode | undefined, names: Set<string>): void {
    if (!node) return;
    if (node.kind === 'resolverValueNode' && node.name) {
        names.add(node.name);
    } else if (node.kind === 'conditionalValueNode') {
        extractResolverNodeName(node.condition, names);
        extractResolverNodeName(node.ifTrue, names);
        extractResolverNodeName(node.ifFalse, names);
    }
}
