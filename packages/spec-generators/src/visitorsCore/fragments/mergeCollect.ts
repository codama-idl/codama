import { type Fragment, fragment } from '@codama/fragments/javascript';
import { type AttributeSpec } from '@codama/spec';

import { getChildShape } from '../walkStep';

/**
 * Build the merge-visitor collect fragment for one attribute. Returns
 * `undefined` for data attributes (no contribution to the merge list)
 * and a `...spread` fragment for child references — either a direct
 * `...visit(this)(node.<name>)` for required single-node attrs, a
 * `...(node.<name> ? visit(this)(node.<name>) : [])` guard for
 * optional ones, or a `...(node.<name> ?? []).flatMap(visit(this))`
 * spread for arrays.
 */
export function getMergeCollectFragment(attr: AttributeSpec): Fragment | undefined {
    const fieldAccess = `node.${attr.name}`;
    const shape = getChildShape(attr.type);
    const optional = attr.optional === true;
    const visitThis = fragment`visit(this)`;

    switch (shape.kind) {
        case 'data':
            return undefined;

        case 'node':
        case 'nestedNode':
        case 'union':
            if (optional) {
                return fragment`...(${fieldAccess} ? ${visitThis}(${fieldAccess}) : [])`;
            }
            return fragment`...${visitThis}(${fieldAccess})`;

        case 'arrayNode':
        case 'arrayUnion':
            return fragment`...(${fieldAccess} ?? []).flatMap(${visitThis})`;
    }
}
