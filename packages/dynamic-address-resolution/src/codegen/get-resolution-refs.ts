import { type DefinedTypeNode, type InstructionNode, isNode, pascalCase, type TypeNode } from 'codama';

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

export function getResolutionRefs(ix: InstructionNode, definedTypes: DefinedTypeNode[] = []): ResolutionRefs {
    const typeName = pascalCase(ix.identifier);
    const data = resolveType(ix.data, definedTypes);
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

/** Resolve a link to its defined type when found, keeping unresolved links as data of unknown shape. */
function resolveType(type: TypeNode | undefined, definedTypes: DefinedTypeNode[]): TypeNode | undefined {
    if (!isNode(type, 'definedTypeLinkNode')) return type;
    return definedTypes.find(definedType => definedType.identifier === type.identifier)?.type ?? type;
}
