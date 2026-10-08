import { CODAMA_ERROR__CANNOT_RESOLVE_PATH, CodamaError } from '@codama/errors';
import { PathString } from '@codama/nodes';
import { getLastNodeFromPath, parsePath, PathSegment } from '@codama/visitors-core';

import { DecodedNode, isDecodedNode } from './decoded';
import type { FormattedNode } from './formatted';

/**
 * Get the decoded node a path expression points to within a decoded node, e.g. to fill the
 * `${data.config.fees[0]}` placeholder of an instruction display. It works on formatted nodes
 * too, returning a formatted node.
 *
 * A `.identifier` segment selects a struct field, returned as is, e.g. with its label when
 * formatted, and an `[n]` segment selects the n-th item of an array, set or tuple. Accounts,
 * events, instructions, defined types, struct fields and enum variants along the way resolve to
 * their data or type, as for `resolveTypePath`. Options and enums are not, so a path cannot
 * go through them.
 *
 * Returns `undefined` when the decoded data has no such node, i.e. an index beyond the items of
 * an array or set.
 *
 * @throws `CODAMA_ERROR__CANNOT_RESOLVE_PATH` when a segment cannot be applied to the node it
 *   reaches, e.g. an unknown struct field or an index into an integer.
 *
 * @example
 * ```ts
 * // data: struct { config: struct { fees: array(u16) } }
 * getDecodedNodeAtPath(instruction, pathString('config.fees[0]')); // the decoded u16
 * getDecodedNodeAtPath(formatDecodedNode(instruction), pathString('config.fees[0]'))?.text; // "25"
 * ```
 */
export function getDecodedNodeAtPath(decoded: FormattedNode, path: PathString): FormattedNode | undefined;
export function getDecodedNodeAtPath(decoded: DecodedNode, path: PathString): DecodedNode | undefined;
export function getDecodedNodeAtPath(decoded: DecodedNode, path: PathString): DecodedNode | undefined {
    let current: DecodedNode = decoded;
    for (const segment of parsePath(path)) {
        const container = resolveContainer(current, path, segment);
        if (segment.kind === 'field') {
            const field = isDecodedNode(container, 'structTypeNode')
                ? container.fields.find(field => getLastNodeFromPath(field.path).identifier === segment.identifier)
                : undefined;
            if (!field) throw getCannotResolvePathError(container, path, segment);
            current = field;
        } else if (isDecodedNode(container, 'tupleTypeNode')) {
            const item = container.items[segment.index];
            if (!item) throw getCannotResolvePathError(container, path, segment);
            current = item;
        } else if (isDecodedNode(container, ['arrayTypeNode', 'setTypeNode'])) {
            const item = container.items[segment.index];
            if (!item) return undefined;
            current = item;
        } else {
            throw getCannotResolvePathError(container, path, segment);
        }
    }
    return current;
}

/** Resolve accounts, events, instructions, defined types, struct fields and enum variants to their data or type. */
function resolveContainer(decoded: DecodedNode, path: PathString, segment: PathSegment): DecodedNode {
    let current = decoded;
    for (;;) {
        if (isDecodedNode(current, ['accountNode', 'enumVariantTypeNode', 'eventNode', 'instructionNode'])) {
            if (!current.data) throw getCannotResolvePathError(current, path, segment);
            current = current.data;
        } else if (isDecodedNode(current, ['definedTypeNode', 'structFieldTypeNode'])) {
            current = current.type;
        } else {
            return current;
        }
    }
}

function getCannotResolvePathError(decoded: DecodedNode, path: PathString, segment: PathSegment): CodamaError {
    return new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
        nodePath: decoded.path,
        path,
        segment: segment.kind === 'field' ? segment.identifier : `[${segment.index}]`,
    });
}
