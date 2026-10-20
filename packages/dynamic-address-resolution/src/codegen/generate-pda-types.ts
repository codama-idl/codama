import {
    getLinkablesFromNode,
    type NodePath,
    pascalCase,
    type PdaNode,
    type RootNode,
    type TypeNode,
    type VariablePdaSeedNode,
} from 'codama';

import { codamaTypeToTS } from './codama-type-to-ts';
import { collectPdaNodesFromIdl } from './collect-pda-nodes';

/**
 * Generate `${Pda}Seeds` types and the aggregate `${Program}Pdas` map type, whose
 * functions take an optional `programId` overriding the program deriving the PDA.
 * Recursive seed types are referenced by the aliases `generateDefinedTypes` emits.
 *
 * Returns the type block with the aggregate map type name. `mapTypeName` is `null` when the program has no PDAs.
 */
export function generatePdaTypes(idl: RootNode): { mapTypeName: string | null; typeBlock: string } {
    const programName = pascalCase(idl.program.identifier);
    const linkables = getLinkablesFromNode(idl);
    const pdaMap = collectPdaNodesFromIdl(idl);

    if (pdaMap.size === 0) {
        return { mapTypeName: null, typeBlock: '' };
    }

    let output = '';

    for (const [pdaName, pdaNode] of pdaMap) {
        const variableSeeds = getVariableSeedNodes(pdaNode);
        if (variableSeeds.length === 0) continue;
        const typeName = pascalCase(pdaName);
        output += `export type ${typeName}Seeds = {\n`;
        for (const seed of variableSeeds) {
            const tsType = seed.type
                ? codamaTypeToTS(getVariableSeedTypePath(idl, pdaNode, seed), linkables)
                : 'unknown/** missing type in variablePdaSeedNode */';
            output += `    ${seed.identifier}: ${tsType};\n`;
        }
        output += '};\n\n';
    }

    const mapTypeName = `${programName}Pdas`;
    output += `/**\n * Strongly-typed PDAs for ${programName}.\n */\n`;
    output += `export type ${mapTypeName} = {\n`;
    for (const [pdaName, pdaNode] of pdaMap) {
        const typeName = pascalCase(pdaName);
        const seedsParam =
            getVariableSeedNodes(pdaNode).length > 0 ? `seeds: ${typeName}Seeds` : `seeds?: Record<string, unknown>`;
        output += `    ${pdaName}: (${seedsParam}, options?: { programId?: Address }) => Promise<ProgramDerivedAddress>;\n`;
    }
    output += '};\n\n';

    return { mapTypeName, typeBlock: output };
}

export function getVariableSeedNodes(pdaNode: PdaNode): VariablePdaSeedNode[] {
    return (pdaNode.seeds ?? []).filter(s => s.kind === 'variablePdaSeedNode');
}

/**
 * The path of the type of a variable seed, used to resolve its links. PDAs collected from the
 * instructions of the program resolve their links within that program, as PDAs of the program do.
 */
export function getVariableSeedTypePath(
    idl: RootNode,
    pdaNode: PdaNode,
    seed: VariablePdaSeedNode,
): NodePath<TypeNode> {
    return [idl, idl.program, pdaNode, seed, seed.type];
}
