import type * as v1 from '../v1';
import type * as v2 from '../v2';
import { getLastV1NodeFromPath, V1NodePath } from './paths';
import { compactAndFreeze, pathFromV1 } from './shared';
import { constantValueNodeFromV1 } from './valueNodes';

export function discriminatorNodeFromV1(path: V1NodePath<v1.DiscriminatorNode>): v2.DiscriminatorNode {
    const discriminator = getLastV1NodeFromPath(path);
    switch (discriminator.kind) {
        case 'constantDiscriminatorNode':
            return compactAndFreeze({
                kind: 'constantDiscriminatorNode',
                offset: discriminator.offset,
                constant: constantValueNodeFromV1([...path, discriminator.constant]),
            });
        case 'fieldDiscriminatorNode':
            // v1 fields are referenced by name, which is a valid v2 path to the same top-level field.
            return compactAndFreeze({
                kind: 'fieldDiscriminatorNode',
                path: pathFromV1(discriminator.name),
                offset: discriminator.offset,
            });
        case 'sizeDiscriminatorNode':
            return compactAndFreeze({ kind: 'sizeDiscriminatorNode', size: discriminator.size });
    }
}
