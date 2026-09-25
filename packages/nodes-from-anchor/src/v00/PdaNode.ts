import {
    booleanValueNode,
    bytesTypeNode,
    constantPdaSeedNode,
    constantPdaSeedNodeFromProgramId,
    integerValueNode,
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
    const name = idl.name ?? '';
    const seeds = (idl.seeds ?? []).map((seed): PdaSeedNode => {
        if (seed.kind === 'constant') {
            const value = (() => {
                if (typeof seed.value === 'string') return stringValueNode(seed.value);
                if (typeof seed.value === 'number') return integerValueNode(String(seed.value));
                return booleanValueNode(seed.value);
            })();
            return constantPdaSeedNode(pdaSeedTypeNodeFromAnchorV00(seed.type), value);
        }
        if (seed.kind === 'variable') {
            return variablePdaSeedNode(seed.name, pdaSeedTypeNodeFromAnchorV00(seed.type), {
                docs: seed.description || undefined,
            });
        }
        return constantPdaSeedNodeFromProgramId();
    });
    return pdaNode({ identifier: name, seeds });
}

/** The type of a PDA seed, i.e. strings and byte arrays without their Borsh size prefix. */
export function pdaSeedTypeNodeFromAnchorV00(type: IdlV00Type): TypeNode {
    // Anchor derives PDA seeds from raw bytes, so strings and byte
    // arrays lose their Borsh size prefix when used as seeds.
    if (type === 'string') return stringTypeNode('utf8');
    if (type === 'bytes') return bytesTypeNode();
    return typeNodeFromAnchorV00(type);
}
