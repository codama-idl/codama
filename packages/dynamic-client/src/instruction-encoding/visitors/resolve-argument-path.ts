import {
    CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CODAMA_ERROR__LINKED_NODE_NOT_FOUND,
    CodamaError,
} from '@codama/errors';
import type { ArgumentValueNode, CamelCaseString, RootNode, TypeNode } from 'codama';
import { isNode } from 'codama';

import { isObjectRecord } from '../../shared/util';

/**
 * Format an ArgumentValueNode reference as a dotted display string.
 * Example: `{ name: "planData", path: ["planId"] }` → `"planData.planId"`.
 */
export function formatArgumentReference(node: ArgumentValueNode): string {
    return node.path && node.path.length > 0 ? `${node.name}.${node.path.join('.')}` : node.name;
}

/**
 * Format a path array as the `argumentPath` suffix expected by ARGUMENT_MISSING error context.
 * Empty/missing path → "" (so the error message renders just the argument name).
 */
function pathSuffix(path: readonly CamelCaseString[]): string {
    return path.length > 0 ? `.${path.join('.')}` : '';
}

/**
 * Walks `path` through a top-level instruction-arg type to the leaf field's typeNode.
 * Descends through structTypeNode fields and resolves definedTypeLinkNode along the way.
 * Throws INVARIANT_VIOLATION if the path doesn't resolve through a struct field.
 */
export function resolveArgumentPathType(
    rootType: TypeNode,
    path: readonly CamelCaseString[],
    root: RootNode,
    argumentName: CamelCaseString,
): TypeNode {
    let current = rootType;
    const visited: CamelCaseString[] = [];
    for (const segment of path) {
        current = unwrapDefinedTypeLink(current, root);
        if (!isNode(current, 'structTypeNode')) {
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
                message: `Cannot walk argument path "${argumentName}${pathSuffix([...visited, segment])}": expected structTypeNode at "${argumentName}${pathSuffix(visited)}", got ${current.kind}.`,
            });
        }
        const field = current.fields.find(f => f.name === segment);
        if (!field) {
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
                message: `Argument path "${argumentName}${pathSuffix([...visited, segment])}" does not exist: struct has no field "${segment}".`,
            });
        }
        current = field.type;
        visited.push(segment);
    }
    return current;
}

/**
 * Walks `path` through a top-level argument input value to the leaf value.
 * Each step requires the intermediate value to be a non-null object.
 * Throws ARGUMENT_MISSING if any intermediate (or the leaf) is undefined/null.
 */
export function resolveArgumentPathValue(
    rootValue: unknown,
    path: readonly CamelCaseString[],
    argumentName: CamelCaseString,
    instructionName: CamelCaseString,
): unknown {
    let current = rootValue;
    const visited: CamelCaseString[] = [];
    for (const segment of path) {
        if (current === undefined || current === null) {
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING, {
                argumentName,
                argumentPath: pathSuffix(visited),
                instructionName,
            });
        }
        if (!isObjectRecord(current)) {
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
                message: `Cannot read "${segment}" from argument "${argumentName}${pathSuffix(visited)}": value is not an object.`,
            });
        }
        current = current[segment];
        visited.push(segment);
    }
    return current;
}

function unwrapDefinedTypeLink(node: TypeNode, root: RootNode, seen: Set<CamelCaseString> = new Set()): TypeNode {
    if (!isNode(node, 'definedTypeLinkNode')) return node;
    if (seen.has(node.name)) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
            message: `Circular definedTypeLinkNode chain encountered while resolving argument path through "${node.name}".`,
        });
    }
    seen.add(node.name);
    const definedType = root.program.definedTypes.find(dt => dt.name === node.name);
    if (!definedType) {
        throw new CodamaError(CODAMA_ERROR__LINKED_NODE_NOT_FOUND, {
            kind: 'definedTypeLinkNode',
            linkNode: node,
            name: node.name,
            path: [],
        });
    }
    return unwrapDefinedTypeLink(definedType.type, root, seen);
}

export { pathSuffix as formatArgumentPathSuffix };
