import type * as v1 from '../v1';
import type * as v2 from '../v2';
import { getLastV1NodeFromPath, V1NodePath } from './paths';
import { compactAndFreeze, docsFromV1 } from './shared';
import { typeNodeFromV1 } from './typeNodes';
import { valueNodeFromV1 } from './valueNodes';

export function pdaNodeFromV1(path: V1NodePath<v1.PdaNode>): v2.PdaNode {
    const pda = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        docs: docsFromV1(pda.docs),
        identifier: pda.name as string as v2.IdentifierString,
        kind: 'pdaNode',
        programId: pda.programId,
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
                docs: docsFromV1(seed.docs),
                identifier: seed.name as string as v2.IdentifierString,
                kind: 'variablePdaSeedNode',
                type: typeNodeFromV1([...path, seed.type]),
            });
    }
}
