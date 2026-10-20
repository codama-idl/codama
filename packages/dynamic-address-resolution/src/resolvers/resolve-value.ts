import { getNodeCodecVisitor } from '@codama/dynamic-codecs';
import {
    CODAMA_ERROR__CANNOT_RESOLVE_PATH,
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__FETCH_ACCOUNTS_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE,
    CodamaError,
} from '@codama/errors';
import { decodeAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import {
    type AccountDataValueNode,
    type AccountLinkNode,
    type AccountNode,
    accountValueNode,
    type DefinedTypeLinkNode,
    type DefinedTypeNode,
    getLastNodeFromPath,
    INSTRUCTION_INPUT_VALUE_NODE_KINDS,
    type InstructionInputValueNode,
    isNode,
    type NodePath,
    NodeStack,
    parsePath,
    type PathSegment,
    type PathString,
    pathString,
    resolveTypePath,
    type StructFieldTypeNode,
    type TypePath,
    type TypePathNode,
    VALUE_NODE_KINDS,
    visit,
} from 'codama';

import { toAddressOrThrow } from '../shared/address';
import { getInstruction, getValue } from './context';
import { detectCircularDependency, resolveAccountValueNodeAddress } from './resolve-account-value-node-address';
import type { ResolutionContext } from './types';

/**
 * Resolve the raw value of a node standing for a value of the instruction, e.g. a PDA seed:
 * value nodes, as their codecs would encode them, values within the instruction data, and values
 * within the data of an instruction account. Injected values are resolved from the scope first.
 *
 * @throws `DYNAMIC_CLIENT__UNSUPPORTED_NODE` for other contextual values, e.g. a PDA.
 */
export async function resolveValue(node: InstructionInputValueNode, ctx: ResolutionContext): Promise<unknown> {
    const resolved = ctx.scope.resolveOrThrow(node, { kinds: INSTRUCTION_INPUT_VALUE_NODE_KINDS });
    if (isNode(resolved, VALUE_NODE_KINDS)) return getValue(ctx, ctx.instructionPath, resolved);
    if (isNode(resolved, 'dataValueNode')) return await getDataValue(ctx, resolved.path);
    if (isNode(resolved, 'accountDataValueNode')) return await getAccountDataValue(ctx, resolved);
    // The resolved node may come from a provider, so its path is the node itself.
    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE, { path: [resolved] });
}

/**
 * Get the value at the given path within the instruction data, as its codec
 * would encode it.
 *
 * Each field along the path uses its default value the same way its codec
 * encodes it: always when its `defaultValueStrategy` is `omitted`, and when
 * missing from the input otherwise. For instance, `config.owner` is read from
 * the default value of `config` when `config` is missing. Default values that
 * codecs cannot evaluate, e.g. injected from account data, are resolved as
 * {@link resolveValue} does. Returns `undefined` when the value is missing and
 * has no default value.
 *
 * A `.data` segment applied to a public key whose type carries an `accountLink`
 * continues into the data of the account at that address, e.g. `mint.data.decimals`,
 * which `ctx.fetchAccounts` fetches.
 */
export async function getDataValue(ctx: ResolutionContext, path: PathString): Promise<unknown> {
    const instruction = getInstruction(ctx);
    // Resolving the path against the data type first ensures it exists.
    if (!instruction.data) {
        const [segment] = parsePath(path);
        throw new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
            path: ctx.instructionPath,
            pathString: path,
            segment: segment ? formatPathSegment(segment) : path,
        });
    }
    return await getValueAtPath(ctx, [...ctx.instructionPath, instruction.data], ctx.dataInput, path, {
        isInstructionData: true,
    });
}

/** Same as {@link getDataValue} but throws when the value is missing. */
export async function getRequiredDataValue(ctx: ResolutionContext, path: PathString): Promise<unknown> {
    const value = await getDataValue(ctx, path);
    if (value === undefined || value === null) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING, {
            path: ctx.instructionPath,
            pathString: path,
        });
    }
    return value;
}

/**
 * Get the value an `accountDataValueNode` refers to: the decoded data of an instruction account,
 * or the value at its path within it. The account is resolved like any other, e.g. from its
 * default value, then fetched using `ctx.fetchAccounts` and decoded using its `accountLink`.
 */
export async function getAccountDataValue(ctx: ResolutionContext, node: AccountDataValueNode): Promise<unknown> {
    const instruction = getInstruction(ctx);
    const ixAccountNode = (instruction.accounts ?? []).find(account => account.identifier === node.account);
    if (!ixAccountNode) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND, {
            path: ctx.instructionPath,
            referencedName: node.account,
        });
    }
    if (!ixAccountNode.accountLink) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
            message: `Cannot read the data of account [${node.account}] in [${instruction.identifier}]: it has no accountLink.`,
        });
    }

    const accountPath = ctx.linkables.getPathOrThrow([
        ...ctx.instructionPath,
        ixAccountNode,
        ixAccountNode.accountLink,
    ]);
    const address = await resolveAccountValueNodeAddress(accountValueNode(node.account), ctx);
    if (address === null) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
            path: [...ctx.instructionPath, ixAccountNode],
        });
    }

    const data = await readAccountData(ctx, address, accountPath);
    if (!node.path) return data;
    return await getValueAtPath(ctx, [...accountPath, getLastNodeFromPath(accountPath).data], data, node.path, {
        isInstructionData: false,
    });
}

/**
 * Walk a path through a value whose type is at the end of `source`, following account links
 * into the data of their accounts. Only the fields of the instruction data use their default
 * values: decoded account data is complete. Contextual default values, e.g. injected from
 * account data, are only supported on top-level fields, as for codecs.
 */
async function getValueAtPath(
    ctx: ResolutionContext,
    source: TypePath,
    value: unknown,
    path: PathString,
    options: { isInstructionData: boolean },
): Promise<unknown> {
    // Each segment is resolved from the start of the path within the current source, i.e. the
    // instruction data or the data of the last account crossed, so errors report that path.
    let currentSource = source;
    let currentPath = '';
    let typePath: TypePath = source;
    let isInstructionData = options.isInstructionData;
    let current = value;

    for (const [index, segment] of parsePath(path).entries()) {
        // A `.data` segment on a linked public key enters the data of its account.
        const accountPath =
            segment.kind === 'field' && segment.identifier === 'data' ? getLinkedAccountPath(typePath, ctx) : undefined;
        if (accountPath) {
            if (current === undefined || current === null) return undefined;
            const address = toAddressOrThrow(current, typePath);
            current = await readAccountData(ctx, address, accountPath);
            currentSource = [...accountPath, getLastNodeFromPath(accountPath).data];
            typePath = currentSource;
            currentPath = '';
            isInstructionData = false;
            continue;
        }

        currentPath +=
            segment.kind === 'field' && currentPath !== '' ? `.${segment.identifier}` : formatPathSegment(segment);
        typePath = resolveTypePath(currentSource, pathString(currentPath), ctx.linkables);
        const key = segment.kind === 'field' ? segment.identifier : segment.index;
        current =
            current === undefined || current === null ? undefined : (current as Record<PropertyKey, unknown>)[key];

        const node = getLastNodeFromPath(typePath);
        if (!isInstructionData || !isNode(node, 'structFieldTypeNode') || node.defaultValue === undefined) continue;
        if (node.defaultValueStrategy !== 'omitted' && current !== undefined) continue;
        // Like codecs, only top-level fields get contextual default values resolved beforehand,
        // see `resolveInstructionDataDefaultValues`, so nested ones are not supported.
        const contextualValue = index > 0 ? getContextualDefaultValue(ctx, node) : undefined;
        if (contextualValue) {
            // A default value injected by a provider is not within the field, so its path is the value itself.
            const path = node.defaultValue === contextualValue ? [...typePath, contextualValue] : [contextualValue];
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE, { path });
        }
        current = await getFieldDefaultValue(ctx, typePath as NodePath<StructFieldTypeNode>, currentPath);
    }
    return current;
}

/**
 * The value of the default value of an instruction data field, at the given path within the
 * instruction data. Default values that codecs can evaluate are, and others, e.g. injected
 * from account data, are resolved as {@link resolveValue} does.
 */
export async function getFieldDefaultValue(
    ctx: ResolutionContext,
    fieldPath: NodePath<StructFieldTypeNode>,
    path: string,
): Promise<unknown> {
    const field = getLastNodeFromPath(fieldPath);
    if (!field.defaultValue) return undefined;
    const contextualValue = getContextualDefaultValue(ctx, field);
    if (!contextualValue) return getValue(ctx, fieldPath.slice(0, -1) as NodePath, field.defaultValue);

    const entry = { key: `data.${path}`, path: fieldPath };
    detectCircularDependency(entry, ctx);
    return await resolveValue(contextualValue, { ...ctx, resolutionPath: [...ctx.resolutionPath, entry] });
}

/**
 * The contextual value the default value of a field is injected from, e.g. an
 * `accountDataValueNode`, if any. Codecs cannot evaluate these default values.
 */
export function getContextualDefaultValue(
    ctx: Pick<ResolutionContext, 'scope'>,
    field: StructFieldTypeNode,
): InstructionInputValueNode | undefined {
    if (!field.defaultValue) return undefined;
    const resolved = ctx.scope.resolve(field.defaultValue, { kinds: INSTRUCTION_INPUT_VALUE_NODE_KINDS });
    if (resolved === undefined || isNode(resolved, VALUE_NODE_KINDS)) return undefined;
    return resolved;
}

/**
 * The path of the account a public key links to, if the type at the end of `typePath`
 * resolves to a public key carrying an `accountLink`, following struct fields and defined types.
 */
function getLinkedAccountPath(typePath: TypePath, ctx: ResolutionContext): NodePath<AccountNode> | undefined {
    let current = typePath;
    const followedTypes = new Set<DefinedTypeNode>();
    for (;;) {
        const node = getLastNodeFromPath(current as NodePath<TypePathNode>);
        if (isNode(node, 'structFieldTypeNode')) {
            current = [...current, node.type];
        } else if (isNode(node, 'definedTypeLinkNode')) {
            const definedTypePath = ctx.linkables.getPathOrThrow(current as NodePath<DefinedTypeLinkNode>);
            const definedType = getLastNodeFromPath(definedTypePath);
            if (followedTypes.has(definedType)) return undefined;
            followedTypes.add(definedType);
            current = [...definedTypePath, definedType.type];
        } else if (isNode(node, 'publicKeyTypeNode') && node.accountLink) {
            return ctx.linkables.getPathOrThrow([...current, node.accountLink] as NodePath<AccountLinkNode>);
        } else {
            return undefined;
        }
    }
}

/**
 * Fetch the account at the given address and decode its data using the account at the end of
 * `accountPath`. Decoding errors are Kit's `SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT`.
 *
 * @throws `DYNAMIC_CLIENT__FETCH_ACCOUNTS_MISSING` when the context has no `fetchAccounts` function.
 */
async function readAccountData(
    ctx: ResolutionContext,
    address: Address,
    accountPath: NodePath<AccountNode>,
): Promise<unknown> {
    // Generated types require `fetchAccounts` for instructions reading account data, but untyped callers may omit it.
    if (!ctx.fetchAccounts) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FETCH_ACCOUNTS_MISSING, { path: accountPath });
    }
    const [account] = await ctx.fetchAccounts([address]);
    const codecVisitor = getNodeCodecVisitor(ctx.linkables, { stack: new NodeStack(accountPath.slice(0, -1)) });
    // Decoded nodes are objects, as Kit's `decodeAccount` requires, whatever the account data.
    return decodeAccount(account, visit(getLastNodeFromPath(accountPath), codecVisitor)).data.value;
}

function formatPathSegment(segment: PathSegment): string {
    return segment.kind === 'field' ? segment.identifier : `[${segment.index}]`;
}
