import { isNode, type PdaNode, type RootNode } from 'codama';

/**
 * Collects unique PDA definitions from the IDL.
 *
 * Scans both `root.program.pdas` (registered PDAs) and inline
 * `pdaValueNode > pdaNode` definitions inside instruction account
 * `defaultValue` nodes. Deduplicates by PDA name.
 */
export function collectPdaNodes(root: RootNode): Map<string, PdaNode> {
    const pdas = new Map<string, PdaNode>();

    for (const pda of root.program.pdas) {
        pdas.set(pda.name, pda);
    }

    for (const ix of root.program.instructions) {
        for (const acc of ix.accounts) {
            if (!acc.defaultValue || !isNode(acc.defaultValue, 'pdaValueNode')) continue;
            if (!isNode(acc.defaultValue.pda, 'pdaNode')) continue;
            const pdaNode = acc.defaultValue.pda;
            if (!pdas.has(pdaNode.name)) {
                pdas.set(pdaNode.name, pdaNode);
            }
        }
    }

    return pdas;
}
