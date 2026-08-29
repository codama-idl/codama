import {
    booleanValueNode,
    bytesTypeNode,
    camelCase,
    constantPdaSeedNode,
    constantPdaSeedNodeFromProgramId,
    numberValueNode,
    PdaNode,
    pdaNode,
    PdaSeedNode,
    stringTypeNode,
    stringValueNode,
    TypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';

import { IdlV00PdaDef, IdlV00Type } from './idl';
import { typeNodeFromAnchorV00 } from './typeNodes';

export function pdaNodeFromAnchorV00(idl: IdlV00PdaDef): PdaNode {
    const name = camelCase(idl.name ?? '');
    const seeds = (idl.seeds ?? []).map((seed): PdaSeedNode => {
        if (seed.kind === 'constant') {
            const value = (() => {
                if (typeof seed.value === 'string') return stringValueNode(seed.value);
                if (typeof seed.value === 'number') return numberValueNode(seed.value);
                return booleanValueNode(seed.value);
            })();
            return constantPdaSeedNode(pdaSeedTypeNodeFromAnchorV00(seed.type), value);
        }
        if (seed.kind === 'variable') {
            return variablePdaSeedNode(
                seed.name,
                pdaSeedTypeNodeFromAnchorV00(seed.type),
                seed.description ? [seed.description] : [],
            );
        }
        return constantPdaSeedNodeFromProgramId();
    });
    return pdaNode({ name, seeds });
}

function pdaSeedTypeNodeFromAnchorV00(type: IdlV00Type): TypeNode {
    // Anchor derives PDA seeds from raw bytes, so strings and byte
    // arrays lose their Borsh size prefix when used as seeds.
    if (type === 'string') return stringTypeNode('utf8');
    if (type === 'bytes') return bytesTypeNode();
    return typeNodeFromAnchorV00(type);
}
