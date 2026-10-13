import { CODAMA_ERROR__UNRECOGNIZED_NODE_KIND, CodamaError } from '@codama/errors';
import { DefinedTypeLinkNode, DefinedTypeNode, isNode, StandaloneTypeNode, TypeNode, ValueNode } from '@codama/nodes';

import { LinkableDictionary } from './LinkableDictionary';
import { getLastNodeFromPath, NodePath } from './NodePath';
import type { TypePath } from './resolveTypePath';

/**
 * Whether a concrete value node is a value of the type at the end of
 * `typePath`, structurally: its kind fits the type and so do its children,
 * e.g. the items of an array, the fields of a struct or the data of an enum
 * variant. Links to defined types are followed. Ranges are not checked,
 * e.g. `integerValueNode('256')` is a value of a `u8`.
 *
 * Injected and constant values are not concrete, so they are never values
 * of a type here. Numbers accept integers, floats also accept floats, a
 * struct value must provide every field without a default value, and an
 * enum value must name a variant of the enum and carry its data, if any.
 * The enum link of an enum value is not compared to the type, as values are
 * matched by their structure only.
 *
 * @param value - The value node, e.g. `noneValueNode()`.
 * @param typePath - The path to the type, used to follow links to defined types.
 * @param linkables - Used to follow `definedTypeLinkNode`s.
 * @throws `CODAMA_ERROR__LINKED_NODE_NOT_FOUND` when a link cannot be resolved.
 *
 * @example
 * ```ts
 * isValueNodeOfType(noneValueNode(), [root, program, optionTypeNode(integerTypeNode('u64'))], linkables); // true
 * isValueNodeOfType(stringValueNode('All'), [root, program, integerTypeNode('u64')], linkables); // false
 * ```
 */
export function isValueNodeOfType(value: ValueNode, typePath: TypePath, linkables: LinkableDictionary): boolean {
    const resolved = resolveDefinedTypeLinks(typePath, linkables);
    if (!resolved) return false;
    const type = getLastNodeFromPath(resolved as NodePath<StandaloneTypeNode>);
    const isChildOfType = (childValue: ValueNode, childType: TypeNode): boolean =>
        isValueNodeOfType(childValue, [...resolved, childType], linkables);

    switch (type.kind) {
        case 'booleanTypeNode':
            return isNode(value, 'booleanValueNode');
        case 'bytesTypeNode':
            return isNode(value, 'bytesValueNode');
        case 'dateTimeTypeNode':
        case 'durationTypeNode':
        case 'fixedPointTypeNode':
        case 'integerTypeNode':
            return isNode(value, 'integerValueNode');
        case 'floatTypeNode':
            return isNode(value, ['floatValueNode', 'integerValueNode']);
        case 'publicKeyTypeNode':
            return isNode(value, 'publicKeyValueNode');
        case 'stringTypeNode':
            return isNode(value, 'stringValueNode');
        case 'arrayTypeNode':
            return isNode(value, 'arrayValueNode') && (value.items ?? []).every(item => isChildOfType(item, type.item));
        case 'setTypeNode':
            return isNode(value, 'setValueNode') && (value.items ?? []).every(item => isChildOfType(item, type.item));
        case 'tupleTypeNode': {
            if (!isNode(value, 'tupleValueNode')) return false;
            const items = value.items ?? [];
            const itemTypes = type.items ?? [];
            return items.length === itemTypes.length && items.every((item, i) => isChildOfType(item, itemTypes[i]));
        }
        case 'mapTypeNode':
            return (
                isNode(value, 'mapValueNode') &&
                (value.entries ?? []).every(
                    entry => isChildOfType(entry.key, type.key) && isChildOfType(entry.value, type.value),
                )
            );
        case 'optionTypeNode':
        case 'remainderOptionTypeNode':
        case 'zeroableOptionTypeNode':
            if (isNode(value, 'noneValueNode')) return true;
            return isNode(value, 'someValueNode') && isChildOfType(value.value, type.item);
        case 'structTypeNode': {
            if (!isNode(value, 'structValueNode')) return false;
            const fieldTypes = type.fields ?? [];
            const fieldValues = value.fields ?? [];
            const hasValidFields = fieldValues.every(fieldValue => {
                const fieldType = fieldTypes.find(f => f.identifier === fieldValue.identifier);
                return !!fieldType && isChildOfType(fieldValue.value, fieldType.type);
            });
            const hasRequiredFields = fieldTypes.every(
                fieldType =>
                    fieldType.defaultValue !== undefined ||
                    fieldValues.some(f => f.identifier === fieldType.identifier),
            );
            return hasValidFields && hasRequiredFields;
        }
        case 'enumTypeNode': {
            if (!isNode(value, 'enumValueNode')) return false;
            const variant = (type.variants ?? []).find(v => v.identifier === value.variant);
            if (!variant) return false;
            if (!variant.data) return value.value === undefined;
            return value.value !== undefined && isChildOfType(value.value, variant.data);
        }
        default: {
            // Fails to type-check if a standalone type kind is not handled above.
            const unhandledType: never = type;
            throw new CodamaError(CODAMA_ERROR__UNRECOGNIZED_NODE_KIND, { kind: (unhandledType as TypeNode).kind });
        }
    }
}

/**
 * Follow links to defined types until a standalone type, or `undefined`
 * for alias cycles (e.g. `a = b`, `b = a`), which have no value.
 */
function resolveDefinedTypeLinks(typePath: TypePath, linkables: LinkableDictionary): TypePath | undefined {
    let current = typePath;
    const followedTypes = new Set<DefinedTypeNode>();
    for (;;) {
        const node = current[current.length - 1];
        if (!isNode(node, 'definedTypeLinkNode')) return current;
        const definedTypePath = linkables.getPathOrThrow(current as NodePath<DefinedTypeLinkNode>);
        const definedType = getLastNodeFromPath(definedTypePath);
        if (followedTypes.has(definedType)) return undefined;
        followedTypes.add(definedType);
        current = [...definedTypePath, definedType.type];
    }
}
