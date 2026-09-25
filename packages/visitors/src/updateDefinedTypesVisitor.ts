import { CODAMA_ERROR__VISITORS__DEFINED_TYPE_MEMBER_NOT_FOUND, CodamaError } from '@codama/errors';
import { assertIsNode, DefinedTypeNode, definedTypeNode, DefinedTypeNodeInput, isNode, TypeNode } from '@codama/nodes';
import { getLastNodeFromPath, LinkableDictionary } from '@codama/visitors-core';

import { renameEnumNode, renameStructNode } from './renameHelpers';
import {
    assertValidUpdateKeys,
    createUpdateResolver,
    getAppliedUpdate,
    getUpdateTransformer,
    getUpdateVisitor,
    identifierOrUndefined,
    toRenameMap,
    UpdateEntry,
} from './updateHelpers';

export type DefinedTypeUpdates = AppliedDefinedTypeUpdates | { delete: true };
type AppliedDefinedTypeUpdates = Partial<Omit<DefinedTypeNodeInput, 'data'>> & {
    /** Renames the fields of a struct type or the variants of an enum type, from old to new identifier. */
    data?: Record<string, string>;
};

const DEFINED_TYPE_UPDATE_KEYS = ['data', 'docs', 'identifier', 'plugins', 'type'];

/**
 * Update or delete defined types, keyed by `NodeSelector`s such as defined
 * type identifiers (matched exactly), optionally prefixed by a program
 * identifier.
 *
 * Renames are propagated to every reference:
 * - renaming a defined type renames every `definedTypeLinkNode` pointing to it;
 * - renaming the fields of a struct type (`data`) repoints every path going
 *   through them, e.g. `dataValueNode`s, `accountDataValueNode`s,
 *   `fieldDiscriminatorNode`s and `${data.…}` placeholders of instructions
 *   and accounts whose data links to the type;
 * - renaming the variants of an enum type (`data`) renames the variant of
 *   every `enumValueNode` of that type.
 *
 * @throws {CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS} if an update
 * contains an unrecognised key (e.g. `name` instead of `identifier`).
 * @throws {CODAMA_ERROR__VISITORS__DEFINED_TYPE_MEMBER_NOT_FOUND} if `data`
 * renames a field or variant that does not exist.
 * @throws {CODAMA_ERROR__UNEXPECTED_NODE_KIND} if `data` renames members of
 * a type that is neither a struct nor an enum.
 *
 * @example
 * ```ts
 * updateDefinedTypesVisitor({
 *     'splToken.accountState': { identifier: 'tokenState', data: { frozen: 'isFrozen' } },
 *     unusedType: { delete: true },
 * });
 * ```
 */
export function updateDefinedTypesVisitor(map: Record<string, DefinedTypeUpdates>) {
    const entries = Object.entries(map).map(([selector, updates]): UpdateEntry<AppliedDefinedTypeUpdates> => {
        assertValidUpdateKeys(selector, updates, 'delete' in updates ? ['delete'] : DEFINED_TYPE_UPDATE_KEYS);
        return { select: ['[definedTypeNode]', selector], updates };
    });
    const resolve = createUpdateResolver(entries, (previous, next) => ({
        ...previous,
        ...next,
        data: { ...previous.data, ...next.data },
    }));

    const transformer = getUpdateTransformer('definedTypeNode', resolve, (node, updates, path) => {
        const { data: memberRenames = {}, ...otherUpdates } = updates;
        const original = getLastNodeFromPath(path);
        const type = otherUpdates.type ?? node.type;
        assertMembersExist(original, otherUpdates.type ?? original.type, Object.keys(memberRenames));
        return definedTypeNode({ ...node, ...otherUpdates, type: renameMembers(type, memberRenames) });
    });

    return getUpdateVisitor([transformer], {
        linkables: new LinkableDictionary(),
        renames: {
            definedTypeMembers: path => toRenameMap(getAppliedUpdate(resolve(path))?.data),
            definedTypes: path => identifierOrUndefined(getAppliedUpdate(resolve(path))?.identifier),
        },
    });
}

function renameMembers(type: TypeNode, memberRenames: Record<string, string>): TypeNode {
    if (Object.keys(memberRenames).length === 0) return type;
    if (isNode(type, 'structTypeNode')) return renameStructNode(type, memberRenames);
    assertIsNode(type, 'enumTypeNode');
    return renameEnumNode(type, memberRenames);
}

function assertMembersExist(definedType: DefinedTypeNode, type: TypeNode, renamedMembers: string[]): void {
    if (renamedMembers.length === 0) return;
    assertIsNode(type, ['structTypeNode', 'enumTypeNode']);
    const members = new Set<string>(
        isNode(type, 'structTypeNode')
            ? (type.fields ?? []).map(field => field.identifier)
            : (type.variants ?? []).map(variant => variant.identifier),
    );
    const missingMember = renamedMembers.find(member => !members.has(member));
    if (missingMember !== undefined) {
        throw new CodamaError(CODAMA_ERROR__VISITORS__DEFINED_TYPE_MEMBER_NOT_FOUND, {
            definedType,
            missingMember,
            name: definedType.identifier,
        });
    }
}
