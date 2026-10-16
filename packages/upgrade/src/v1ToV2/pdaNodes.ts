import type * as v1 from '../v1';
import type * as v2 from '../v2';
import { getLastV1NodeFromPath, V1NodePath } from './paths';
import { compactAndFreeze, docsFromV1, identifierFromV1 } from './shared';
import { typeNodeFromV1 } from './typeNodes';
import { valueNodeFromV1 } from './valueNodes';

export function pdaNodeFromV1(path: V1NodePath<v1.PdaNode>): v2.PdaNode {
    const pda = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        kind: 'pdaNode',
        identifier: identifierFromV1(pda.name),
        programId: pda.programId,
        docs: docsFromV1(pda.docs),
        seeds: pda.seeds?.map(seed => pdaSeedNodeFromV1([...path, seed])),
    });
}

export function pdaSeedNodeFromV1(path: V1NodePath<v1.PdaSeedNode>): v2.PdaSeedNode {
    const seed = getLastV1NodeFromPath(path);
    switch (seed.kind) {
        case 'constantPdaSeedNode':
            return compactAndFreeze({
                kind: 'constantPdaSeedNode',
                type: typeNodeFromV1([...path, seed.type]),
                value:
                    seed.value.kind === 'programIdValueNode'
                        ? compactAndFreeze({ kind: 'programIdValueNode' })
                        : valueNodeFromV1([...path, seed.value], [...path, seed.type]),
            });
        case 'variablePdaSeedNode':
            return compactAndFreeze({
                kind: 'variablePdaSeedNode',
                identifier: identifierFromV1(seed.name),
                docs: docsFromV1(seed.docs),
                type: typeNodeFromV1([...path, seed.type]),
            });
    }
}
