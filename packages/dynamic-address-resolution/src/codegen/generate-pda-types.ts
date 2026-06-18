import { pascalCase, type PdaNode, type RootNode, type VariablePdaSeedNode } from 'codama';

import { codamaTypeToTS } from './codama-type-to-ts';
import { collectPdaNodesFromIdl } from './collect-pda-nodes';

/**
 * Generate `${Pda}PdaSeeds` types and the aggregate `${Program}Pdas` map type.
 *
 * Returns the type block with the aggregate map type name. `mapTypeName` is `null` when the program has no PDAs.
 */
export function generatePdaTypes(idl: RootNode): { mapTypeName: string | null; typeBlock: string } {
    const programName = pascalCase(idl.program.name);
    const definedTypes = idl.program.definedTypes ?? [];
    const pdaMap = collectPdaNodesFromIdl(idl);

    if (pdaMap.size === 0) {
        return { mapTypeName: null, typeBlock: '' };
    }

    let output = '';

    for (const [pdaName, pdaNode] of pdaMap) {
        const variableSeeds = getVariableSeedNodes(pdaNode);
        if (variableSeeds.length === 0) continue;
        const typeName = pascalCase(pdaName);
        output += `export type ${typeName}PdaSeeds = {\n`;
        for (const seed of variableSeeds) {
            const tsType = seed.type
                ? codamaTypeToTS(seed.type, definedTypes)
                : 'unknown/** missing type in variablePdaSeedNode */';
            output += `    ${seed.name}: ${tsType};\n`;
        }
        output += '};\n\n';
    }

    const mapTypeName = `${programName}Pdas`;
    output += `/**\n * Strongly-typed PDAs for ${programName}.\n */\n`;
    output += `export type ${mapTypeName} = {\n`;
    for (const [pdaName, pdaNode] of pdaMap) {
        const typeName = pascalCase(pdaName);
        const seedsParam =
            getVariableSeedNodes(pdaNode).length > 0 ? `seeds: ${typeName}PdaSeeds` : `seeds?: Record<string, unknown>`;
        output += `    ${pdaName}: (${seedsParam}) => Promise<ProgramDerivedAddress>;\n`;
    }
    output += '};\n\n';

    return { mapTypeName, typeBlock: output };
}

function getVariableSeedNodes(pdaNode: PdaNode): VariablePdaSeedNode[] {
    return (pdaNode.seeds ?? []).filter(s => s.kind === 'variablePdaSeedNode');
}
