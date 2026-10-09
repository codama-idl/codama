import { isNode, type NodePath, type PdaNode, type RootNode } from 'codama';

/**
 * Collects the unique PDA definitions of the main program of an IDL, keyed by
 * PDA identifier, together with their path from the root.
 *
 * Scans both `root.program.pdas` (registered PDAs, e.g. `[root, program, pda]`)
 * and inline `pdaValueNode > pdaNode` definitions inside instruction account
 * `defaultValue` nodes (e.g. `[root, program, instruction, account, pdaValue, pda]`).
 * Registered PDAs take precedence over inline ones of the same identifier.
 */
export function collectPdaPaths(root: RootNode): Map<string, NodePath<PdaNode>> {
    const program = root.program;
    const pdas = new Map<string, NodePath<PdaNode>>();

    for (const pda of program.pdas ?? []) {
        pdas.set(pda.identifier, [root, program, pda]);
    }

    for (const instruction of program.instructions ?? []) {
        for (const account of instruction.accounts ?? []) {
            const defaultValue = account.defaultValue;
            if (!isNode(defaultValue, 'pdaValueNode') || !isNode(defaultValue.pda, 'pdaNode')) continue;
            const pda = defaultValue.pda;
            if (!pdas.has(pda.identifier)) {
                pdas.set(pda.identifier, [root, program, instruction, account, defaultValue, pda]);
            }
        }
    }

    return pdas;
}
