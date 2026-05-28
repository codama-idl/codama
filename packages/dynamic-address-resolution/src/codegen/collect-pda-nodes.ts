import type { PdaNode, RootNode } from 'codama';

/**
 * Collects all PdaNodes referenced in an IDL.
 */
export function collectPdaNodesFromIdl(idl: RootNode): Map<string, PdaNode> {
    const pdas = new Map<string, PdaNode>();

    for (const pda of idl.program.pdas ?? []) {
        pdas.set(pda.name, pda);
    }

    for (const ix of idl.program.instructions) {
        for (const acc of ix.accounts) {
            if (!acc.defaultValue || acc.defaultValue.kind !== 'pdaValueNode') continue;
            const pdaDef = acc.defaultValue.pda;
            if (!pdaDef || pdaDef.kind !== 'pdaNode') continue;
            if (!pdas.has(pdaDef.name)) {
                pdas.set(pdaDef.name, pdaDef);
            }
        }
    }

    return pdas;
}
