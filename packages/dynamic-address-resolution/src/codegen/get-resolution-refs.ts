import {
    type DefinedTypeLinkNode,
    type DefinedTypeNode,
    getLastNodeFromPath,
    getLinkablesFromNode,
    type InstructionNode,
    isNode,
    type LinkableDictionary,
    type NodePath,
    pascalCase,
    type TypeNode,
} from 'codama';

import { OPTIONAL_NODE_KINDS } from '../shared/nodes';

/**
 * Symbol registry for the resolvable surface of an instruction.
 *
 * Returns the TypeScript identifier each codegen step in this package
 * (and downstream consumers) should reference when emitting types tied
 * to address resolution. `null` means "this symbol is not emitted for
 * this instruction" — callers pick their own fallback at the use site.
 */
export type ResolutionRefs = {
    /** Identifier of the emitted `${Name}Accounts` type (strict, IDL-named keys only). */
    accountsRef: string;
    /**
     * Identifier of the emitted `${Name}AccountsWithData` type.
     * Widened with `Record<string, Address | null | undefined>`.
     */
    accountsWithDataRef: string;
    /** Identifier of the emitted `${Name}InstructionDataArgs` type, or `null` if there is no data to provide. */
    dataRef: string | null;
    /** `true` when the instruction has data to provide (mirrors `dataRef !== null`). */
    hasData: boolean;
    /** `true` when some of the instruction data must be provided. */
    hasRequiredData: boolean;
};

/**
 * Get the {@link ResolutionRefs} of the instruction at the end of the given path. Its linked data
 * type is resolved from that path, following the program of the link if any, using the linkable
 * nodes of the tree, recorded from the root of the path unless given.
 *
 * @example
 * ```ts
 * getResolutionRefs([root, root.program, transfer]).dataRef; // 'TransferInstructionDataArgs'
 * ```
 */
export function getResolutionRefs(
    path: NodePath<InstructionNode>,
    linkables: LinkableDictionary = getLinkablesFromNode(path[0]),
): ResolutionRefs {
    const ix = getLastNodeFromPath(path);
    const typeName = pascalCase(ix.identifier);
    const data = ix.data ? resolveType([...path, ix.data], linkables) : undefined;
    // Omitted fields always encode their default value, so they are never provided.
    const fields = isNode(data, 'structTypeNode')
        ? (data.fields ?? []).filter(field => field.defaultValueStrategy !== 'omitted' || !field.defaultValue)
        : undefined;
    const hasData = data !== undefined && (fields === undefined || fields.length > 0);
    const hasRequiredData = fields
        ? fields.some(field => field.defaultValue === undefined && !OPTIONAL_NODE_KINDS.includes(field.type.kind))
        : data !== undefined && !OPTIONAL_NODE_KINDS.includes(data.kind);

    return {
        accountsRef: `${typeName}Accounts`,
        accountsWithDataRef: `${typeName}AccountsWithData`,
        dataRef: hasData ? `${typeName}InstructionDataArgs` : null,
        hasData,
        hasRequiredData,
    };
}

/**
 * Resolve links to their defined types when found, keeping unresolved or circular links as
 * data of unknown shape.
 */
function resolveType(path: readonly [...NodePath, TypeNode], linkables: LinkableDictionary): TypeNode {
    let typePath = path;
    const followedTypes = new Set<DefinedTypeNode>();
    for (;;) {
        const type = typePath[typePath.length - 1] as TypeNode;
        if (!isNode(type, 'definedTypeLinkNode')) return type;
        const definedTypePath = linkables.getPath(typePath as unknown as NodePath<DefinedTypeLinkNode>);
        if (!definedTypePath) return type;
        const definedType = getLastNodeFromPath(definedTypePath);
        if (followedTypes.has(definedType)) return type;
        followedTypes.add(definedType);
        typePath = [...definedTypePath, definedType.type];
    }
}
