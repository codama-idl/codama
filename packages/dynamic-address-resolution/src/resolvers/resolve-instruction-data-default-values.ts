import {
    type DefinedTypeLinkNode,
    type DefinedTypeNode,
    getLastNodeFromPath,
    type InstructionNode,
    isNode,
    type LinkableDictionary,
    type NodePath,
    type StructFieldTypeNode,
    type TypeNode,
} from 'codama';

import type { AccountsInput, DataInput, FetchAccountsFn } from '../shared/types';
import { isObjectRecord } from '../shared/util';
import { createResolutionContext } from './context';
import { getContextualDefaultValue, getFieldDefaultValue } from './resolve-value';
import type { ResolutionContext } from './types';

export type ResolveInstructionDataDefaultValuesInput<
    TAccounts extends AccountsInput = AccountsInput,
    TData extends DataInput = DataInput,
> = {
    accountsInput?: TAccounts;
    dataInput?: TData;
    /** Fetches the accounts whose data default values read, e.g. a mint for its `decimals`. */
    fetchAccounts?: FetchAccountsFn;
    /**
     * The linkable nodes of the tree, e.g. from `getLinkablesFromNode(root)`, used to follow links.
     * Defaults to recording them from the root of the path: pass them to avoid recording them again.
     */
    linkables?: LinkableDictionary;
    /** The path of the instruction from the root node, e.g. `[root, program, instruction]`. */
    path: NodePath<InstructionNode>;
};

/**
 * Resolve the default values of the instruction data fields that codecs cannot evaluate, i.e.
 * those injected from contextual values, e.g. `accountDataValueNode('mint', { path: 'decimals' })`.
 * Codecs evaluate default values synchronously, whereas these may need to resolve accounts and
 * fetch their data. Pass the result to the `resolvedDefaultValues` option of the data codec.
 *
 * Only the top-level fields of the instruction data are resolved, and only when they use their
 * default value: always when their `defaultValueStrategy` is `omitted`, and when missing from
 * the data input otherwise.
 *
 * @example
 * ```ts
 * const resolvedDefaultValues = await resolveInstructionDataDefaultValues({
 *     accountsInput: { mint },
 *     dataInput: { amount: 42n },
 *     fetchAccounts: addresses => fetchEncodedAccounts(rpc, addresses),
 *     path: [root, program, transferChecked],
 * });
 * const bytes = getNodeValueCodec(path, { resolvedDefaultValues }).encode({ amount: 42n });
 * ```
 */
export async function resolveInstructionDataDefaultValues<
    TAccounts extends AccountsInput = AccountsInput,
    TData extends DataInput = DataInput,
>({
    accountsInput,
    dataInput,
    fetchAccounts,
    linkables,
    path,
}: ResolveInstructionDataDefaultValuesInput<TAccounts, TData>): Promise<Map<StructFieldTypeNode, unknown>> {
    const ctx = createResolutionContext(path, { accountsInput, dataInput, fetchAccounts, linkables });
    const input: Record<string, unknown> = isObjectRecord(dataInput) ? dataInput : {};
    const fieldPaths = getDataFieldPaths(ctx).filter(fieldPath => {
        const field = getLastNodeFromPath(fieldPath);
        const usesDefaultValue = field.defaultValueStrategy === 'omitted' || input[field.identifier] === undefined;
        return usesDefaultValue && getContextualDefaultValue(ctx, field) !== undefined;
    });

    const values = await Promise.all(
        fieldPaths.map(fieldPath => getFieldDefaultValue(ctx, fieldPath, getLastNodeFromPath(fieldPath).identifier)),
    );
    return new Map(fieldPaths.map((fieldPath, index) => [getLastNodeFromPath(fieldPath), values[index]]));
}

/** The paths of the top-level fields of the instruction data, following defined type links. */
export function getDataFieldPaths(
    ctx: Pick<ResolutionContext, 'instructionPath' | 'linkables'>,
): NodePath<StructFieldTypeNode>[] {
    const data = getLastNodeFromPath(ctx.instructionPath).data;
    if (!data) return [];

    let typePath: readonly [...NodePath, TypeNode] = [...ctx.instructionPath, data];
    const followedTypes = new Set<DefinedTypeNode>();
    for (;;) {
        const type = typePath[typePath.length - 1] as TypeNode;
        if (isNode(type, 'structTypeNode')) {
            return (type.fields ?? []).map(field => [...typePath, field] as unknown as NodePath<StructFieldTypeNode>);
        }
        if (!isNode(type, 'definedTypeLinkNode')) return [];
        const definedTypePath = ctx.linkables.getPathOrThrow(typePath as unknown as NodePath<DefinedTypeLinkNode>);
        const definedType = getLastNodeFromPath(definedTypePath);
        if (followedTypes.has(definedType)) return [];
        followedTypes.add(definedType);
        typePath = [...definedTypePath, definedType.type];
    }
}
