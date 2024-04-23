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
    variablePdaSeedNode,
} from '@kinobi-so/nodes';

import { IdlV00PdaDef } from './idl';
import { typeNodeFromAnchorV00 } from './typeNodes';

export function pdaNodeFromAnchorV00(idl: IdlV00PdaDef): PdaNode {
    const name = camelCase(idl.name ?? '');
    const seeds = (idl.seeds ?? []).map((seed): PdaSeedNode => {
        if (seed.kind === 'constant') {
            const type = (() => {
                if (seed.type === 'string') return stringTypeNode('utf8');
                if (seed.type === 'bytes') return bytesTypeNode();
                return typeNodeFromAnchorV00(seed.type);
            })();
            const value = (() => {
                if (typeof seed.value === 'string') return stringValueNode(seed.value);
                if (typeof seed.value === 'number') return numberValueNode(seed.value);
                return booleanValueNode(seed.value);
            })();
            return constantPdaSeedNode(type, value);
        }
        if (seed.kind === 'variable') {
            return variablePdaSeedNode(
                seed.name,
                typeNodeFromAnchorV00(seed.type),
                seed.description ? [seed.description] : [],
            );
        }
        return constantPdaSeedNodeFromProgramId();
    });
    return pdaNode({ name, seeds });
}
