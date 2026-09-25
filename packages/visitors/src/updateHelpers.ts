import { CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS, CodamaError } from '@codama/errors';
import {
    accountDataValueNode,
    accountLinkNode,
    AccountNode,
    accountValueNode,
    accountBumpValueNode,
    assertIsNode,
    dataValueNode,
    definedTypeLinkNode,
    DefinedTypeNode,
    enumValueNode,
    fieldDiscriminatorNode,
    IdentifierString,
    instructionAccountLinkNode,
    InstructionAccountNode,
    instructionDisplayNode,
    instructionLinkNode,
    InstructionNode,
    isNode,
    identifierString,
    GetNodeFromKind,
    Node,
    NodeKind,
    structFieldTypeNode,
    StructFieldTypeNodeInput,
    structTypeNode,
    tupleTypeNode,
    pdaLinkNode,
    PdaNode,
    programLinkNode,
    ProgramNode,
    TextNode,
    textNode,
    TypeNode,
    ValueNode,
} from '@codama/nodes';
import {
    BottomUpNodeTransformerWithSelector,
    bottomUpTransformerVisitor,
    getConjunctiveNodeSelectorFunction,
    getLastNodeFromPath,
    getNodePathUntilLastNode,
    isNodePath,
    LinkableDictionary,
    NodePath,
    NodeSelector,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    Visitor,
} from '@codama/visitors-core';

/**
 * Throw if `updates` contains keys that the update visitor does not
 * recognise, so misspelt or outdated keys (e.g. v1's `name`) fail loudly
 * instead of being silently ignored.
 */
export function assertValidUpdateKeys(selector: string, updates: object, allowedKeys: readonly string[]): void {
    const unrecognizedKeys = Object.keys(updates).filter(key => !allowedKeys.includes(key));
    if (unrecognizedKeys.length > 0) {
        throw new CodamaError(CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS, {
            allowedKeys: [...allowedKeys],
            selector,
            unrecognizedKeys,
        });
    }
}

/** An entry of an update visitor: the selectors of the updated nodes and the updates to apply. */
export type UpdateEntry<TUpdates> = { select: NodeSelector[]; updates: TUpdates | { delete: true } };

/** The update resolved for a node: its merged updates, a deletion, or nothing. */
export type ResolvedUpdate<TUpdates> = TUpdates | { delete: true } | undefined;

/**
 * Return a function resolving the update of a node from its path in the
 * original tree (such as the paths recorded in a `LinkableDictionary`).
 *
 * Every entry matching the node is combined, in declaration order, using
 * `merge`, so updates from several entries (e.g. `transfer` and
 * `myProgram.transfer`) all apply to the original node. A `delete` entry
 * wins over any other update.
 */
export function createUpdateResolver<TUpdates extends object>(
    entries: readonly UpdateEntry<TUpdates>[],
    merge: (previous: TUpdates, next: TUpdates) => TUpdates,
): (path: NodePath) => ResolvedUpdate<TUpdates> {
    const matchers = entries.map(({ select, updates }) => ({
        matches: getConjunctiveNodeSelectorFunction(select),
        updates,
    }));
    return path => {
        const matching = matchers.filter(({ matches }) => matches(path as NodePath<Node>)).map(m => m.updates);
        const resolved: ResolvedUpdate<TUpdates> = matching.some(update => 'delete' in update)
            ? { delete: true }
            : (matching as TUpdates[]).reduce<TUpdates | undefined>(
                  (merged, update) => (merged ? merge(merged, update) : update),
                  undefined,
              );
        return resolved;
    };
}

/** Narrow a resolved update to the updates to apply, excluding deletions. */
export function getAppliedUpdate<TUpdates extends object>(update: ResolvedUpdate<TUpdates>): TUpdates | undefined {
    return update && !('delete' in update) ? update : undefined;
}

/**
 * Merge two records of per-key updates (e.g. updates keyed by account or
 * field identifier), merging the updates stored under the same key.
 */
export function mergeUpdateRecords<TValue extends object>(
    previous: Record<string, TValue> | undefined,
    next: Record<string, TValue> | undefined,
): Record<string, TValue> | undefined {
    if (!previous || !next) return next ?? previous;
    const merged = { ...previous };
    Object.entries(next).forEach(([key, value]) => {
        merged[key] = { ...merged[key], ...value };
    });
    return merged;
}

/**
 * The renames described by a record of per-key updates carrying optional
 * `identifier`s, from old to new identifier. `undefined` when there is
 * nothing to rename.
 */
export function getRenames(
    updates: Record<string, { identifier?: string }> | undefined,
): ReadonlyMap<string, IdentifierString> | undefined {
    const renames = new Map<string, IdentifierString>();
    Object.entries(updates ?? {}).forEach(([from, { identifier }]) => {
        if (identifier) renames.set(from, identifierString(identifier));
    });
    return renames.size > 0 ? renames : undefined;
}

/** Validate and brand an optional identifier. */
export function identifierOrUndefined(identifier: string | undefined): IdentifierString | undefined {
    return identifier === undefined ? undefined : identifierString(identifier);
}

/** Turn a record of renames (from old to new identifier) into a rename map. `undefined` when empty. */
export function toRenameMap(
    renames: Record<string, string> | undefined,
): ReadonlyMap<string, IdentifierString> | undefined {
    const entries = Object.entries(renames ?? {});
    return entries.length > 0 ? new Map(entries.map(([from, to]) => [from, identifierString(to)])) : undefined;
}

/**
 * The transformer applying the resolved update of every node of a given
 * kind: returning `null` for deletions, the node itself when nothing
 * matches, and otherwise the result of `apply`, which receives the path of
 * the original node alongside the (possibly already transformed) node.
 */
export function getUpdateTransformer<TKind extends NodeKind, TUpdates extends object>(
    kind: TKind,
    resolve: (path: NodePath) => ResolvedUpdate<TUpdates>,
    apply: (node: GetNodeFromKind<TKind>, updates: TUpdates, path: NodePath<GetNodeFromKind<TKind>>) => Node,
): BottomUpNodeTransformerWithSelector {
    return {
        select: `[${kind}]`,
        transform: (node, stack) => {
            assertIsNode(node, kind);
            const path = stack.getPath(kind);
            const updates = resolve(path);
            if (!updates) return node;
            if ('delete' in updates) return null;
            return apply(node, updates, path);
        },
    };
}

/** The updates of a single struct field, e.g. an instruction data field. */
export type DataFieldUpdates = Partial<Omit<StructFieldTypeNodeInput, 'defaultValue'>> & {
    /** The new default value of the field, or `null` to remove it. */
    defaultValue?: ValueNode | null;
};

/**
 * Apply data field updates, keyed by path, in a single walk of the inline
 * structs and tuples of an instruction's data. Paths are those of the
 * walked type, whose fields are only renamed here: each field's children
 * are updated before the field itself, so renaming a field and one of its
 * nested fields in the same update works in any order. Defined type links
 * are not followed since the linked type may be shared.
 *
 * A field whose `type` is replaced cannot also have nested updates, since
 * its original children no longer exist: such nested paths are reported as
 * unused.
 *
 * @returns the updated type and the update paths that matched no field.
 */
export function applyDataUpdates(
    type: TypeNode | undefined,
    updates: Record<string, DataFieldUpdates>,
): { type: TypeNode | undefined; unusedPaths: string[] } {
    const unusedPaths = new Set(Object.keys(updates));
    if (!type || unusedPaths.size === 0) return { type, unusedPaths: [...unusedPaths] };

    const walk = (node: TypeNode, prefix: string): TypeNode => {
        if (isNode(node, 'tupleTypeNode')) {
            return tupleTypeNode(
                (node.items ?? []).map((item, index) => walk(item, `${prefix}[${index}]`)),
                { ...node },
            );
        }
        if (!isNode(node, 'structTypeNode')) return node;
        const fields = (node.fields ?? []).map(field => {
            const path = prefix ? `${prefix}.${field.identifier}` : field.identifier;
            const fieldUpdates = updates[path];
            const walkedField = fieldUpdates?.type
                ? field
                : structFieldTypeNode({ ...field, type: walk(field.type, path) });
            if (!fieldUpdates) return walkedField;
            unusedPaths.delete(path);
            const { defaultValue, ...otherUpdates } = fieldUpdates;
            return structFieldTypeNode({
                ...walkedField,
                ...otherUpdates,
                // Removing a default value also removes its strategy, unless a new one is given.
                ...(defaultValue === null
                    ? { defaultValue: undefined, defaultValueStrategy: otherUpdates.defaultValueStrategy }
                    : defaultValue
                      ? { defaultValue }
                      : {}),
            });
        });
        return structTypeNode(fields, { ...node });
    };

    return { type: walk(type, ''), unusedPaths: [...unusedPaths] };
}

/**
 * Where an update visitor renames things, given the paths of the original
 * (linkable) nodes being referenced. Each function returns the new
 * identifier, or the renames of the node's members, if any.
 */
export type RenamePlan = {
    /** Top-level data field renames of an account, from old to new identifier. */
    accountFields?: (path: NodePath<AccountNode>) => ReadonlyMap<string, IdentifierString> | undefined;
    accounts?: (path: NodePath<AccountNode>) => IdentifierString | undefined;
    /** Top-level field or variant renames of a defined type, from old to new identifier. */
    definedTypeMembers?: (path: NodePath<DefinedTypeNode>) => ReadonlyMap<string, IdentifierString> | undefined;
    definedTypes?: (path: NodePath<DefinedTypeNode>) => IdentifierString | undefined;
    /** Account renames of an instruction, from old to new identifier. */
    instructionAccounts?: (path: NodePath<InstructionNode>) => ReadonlyMap<string, IdentifierString> | undefined;
    /** Inline data field renames of an instruction, from the field's full old path to its new identifier. */
    instructionFields?: (path: NodePath<InstructionNode>) => ReadonlyMap<string, IdentifierString> | undefined;
    instructions?: (path: NodePath<InstructionNode>) => IdentifierString | undefined;
    pdas?: (path: NodePath<PdaNode>) => IdentifierString | undefined;
    programs?: (path: NodePath<ProgramNode>) => IdentifierString | undefined;
};

/**
 * Wrap the transformers of an update visitor so that every linkable node of
 * the original tree is recorded in `linkables` before transforming it, and
 * so that every reference to a node renamed by `renames` is repointed.
 *
 * References are resolved through `linkables` (rather than matched by
 * identifier), so links from other programs are handled correctly.
 * Transformers receive a stack of original nodes, so node paths can always
 * be matched against the update entries.
 */
export function getUpdateVisitor(
    transformers: BottomUpNodeTransformerWithSelector[],
    options: { linkables: LinkableDictionary; renames: RenamePlan },
): Visitor<Node | null> {
    const { linkables, renames } = options;
    return pipe(
        bottomUpTransformerVisitor([...transformers, ...getRenameReferencesTransformers(renames, linkables)]),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}

/** The transformers that repoint references to the nodes listed in `renames`. */
function getRenameReferencesTransformers(
    renames: RenamePlan,
    linkables: LinkableDictionary,
): BottomUpNodeTransformerWithSelector[] {
    const resolvePaths = createPathResolver(renames, linkables);

    return [
        {
            select: '[programLinkNode]',
            transform: (node, stack) => {
                assertIsNode(node, 'programLinkNode');
                const newIdentifier = getRename(renames.programs, linkables.getPath(stack.getPath('programLinkNode')));
                return newIdentifier ? programLinkNode(newIdentifier, { ...node }) : node;
            },
        },
        {
            select: '[accountLinkNode]',
            transform: (node, stack) => {
                assertIsNode(node, 'accountLinkNode');
                const newIdentifier = getRename(renames.accounts, linkables.getPath(stack.getPath('accountLinkNode')));
                return newIdentifier ? accountLinkNode(newIdentifier, { ...node }) : node;
            },
        },
        {
            select: '[pdaLinkNode]',
            transform: (node, stack) => {
                assertIsNode(node, 'pdaLinkNode');
                const newIdentifier = getRename(renames.pdas, linkables.getPath(stack.getPath('pdaLinkNode')));
                return newIdentifier ? pdaLinkNode(newIdentifier, { ...node }) : node;
            },
        },
        {
            select: '[definedTypeLinkNode]',
            transform: (node, stack) => {
                assertIsNode(node, 'definedTypeLinkNode');
                const newIdentifier = getRename(
                    renames.definedTypes,
                    linkables.getPath(stack.getPath('definedTypeLinkNode')),
                );
                return newIdentifier ? definedTypeLinkNode(newIdentifier, { ...node }) : node;
            },
        },
        {
            select: '[instructionLinkNode]',
            transform: (node, stack) => {
                assertIsNode(node, 'instructionLinkNode');
                const newIdentifier = getRename(
                    renames.instructions,
                    linkables.getPath(stack.getPath('instructionLinkNode')),
                );
                return newIdentifier ? instructionLinkNode(newIdentifier, { ...node }) : node;
            },
        },
        {
            select: '[instructionAccountLinkNode]',
            transform: (node, stack) => {
                assertIsNode(node, 'instructionAccountLinkNode');
                const accountPath = linkables.getPath(stack.getPath('instructionAccountLinkNode'));
                const newIdentifier = accountPath
                    ? getInstructionAccountRename(accountPath, getLastNodeFromPath(accountPath).identifier, renames)
                    : undefined;
                return newIdentifier ? instructionAccountLinkNode(newIdentifier, { ...node }) : node;
            },
        },
        {
            select: '[accountValueNode|accountBumpValueNode]',
            transform: (node, stack) => {
                assertIsNode(node, ['accountValueNode', 'accountBumpValueNode']);
                const newIdentifier = getInstructionAccountRename(stack.getPath(), node.identifier, renames);
                if (!newIdentifier) return node;
                return isNode(node, 'accountValueNode')
                    ? accountValueNode(newIdentifier, { ...node })
                    : accountBumpValueNode(newIdentifier, { ...node });
            },
        },
        {
            select: '[dataValueNode]',
            transform: (node, stack) => {
                assertIsNode(node, 'dataValueNode');
                const instructionPath = getNodePathUntilLastNode(stack.getPath(), 'instructionNode');
                if (!instructionPath) return node;
                const path = resolvePaths.fromInstruction(node.path, instructionPath);
                return path === node.path ? node : dataValueNode(path, { ...node });
            },
        },
        {
            select: '[accountDataValueNode]',
            transform: (node, stack) => {
                assertIsNode(node, 'accountDataValueNode');
                const newAccount = getInstructionAccountRename(stack.getPath(), node.account, renames);
                const instructionPath = getNodePathUntilLastNode(stack.getPath(), 'instructionNode');
                const account = instructionPath
                    ? getLastNodeFromPath(instructionPath).accounts?.find(a => a.identifier === node.account)
                    : undefined;
                const path =
                    node.path && instructionPath && account
                        ? resolvePaths.fromInstructionAccount(node.path, instructionPath, account)
                        : node.path;
                if (!newAccount && path === node.path) return node;
                return accountDataValueNode(newAccount ?? node.account, { ...node, path });
            },
        },
        {
            select: '[fieldDiscriminatorNode]',
            transform: (node, stack) => {
                assertIsNode(node, 'fieldDiscriminatorNode');
                const ownerPath = getNodePathUntilLastNode(stack.getPath(), [
                    'accountNode',
                    'eventNode',
                    'instructionNode',
                ]);
                if (!ownerPath) return node;
                const path = resolvePaths.fromOwner(node.path, ownerPath);
                return path === node.path ? node : fieldDiscriminatorNode(path, { ...node });
            },
        },
        {
            select: '[instructionDisplayNode]',
            transform: (node, stack) => {
                assertIsNode(node, 'instructionDisplayNode');
                const instructionPath = getNodePathUntilLastNode(stack.getPath(), 'instructionNode');
                if (!instructionPath || node.interpolatedIntent === undefined) return node;
                const renameIntent = (intent: string): string =>
                    intent.replace(
                        /\$\{(data|accounts)((?:\.[A-Za-z_][A-Za-z0-9_]*|\[(?:0|[1-9][0-9]*)\])*)\}/g,
                        (placeholder: string, root: string, rest: string) => {
                            if (root === 'accounts') {
                                const account = rest.slice(1);
                                const newAccount = getInstructionAccountRename(instructionPath, account, renames);
                                return newAccount ? `\${accounts.${newAccount}}` : placeholder;
                            }
                            const path = rest.startsWith('.') ? rest.slice(1) : rest;
                            const newPath = resolvePaths.fromInstruction(path, instructionPath);
                            if (newPath === path) return placeholder;
                            return `\${data${newPath.startsWith('[') ? '' : '.'}${newPath}}`;
                        },
                    );
                const intent = node.interpolatedIntent;
                const newIntent: string | TextNode =
                    typeof intent === 'string'
                        ? renameIntent(intent)
                        : renameIntent(intent.content) === intent.content
                          ? intent
                          : textNode({ ...intent, content: renameIntent(intent.content) });
                return newIntent === intent ? node : instructionDisplayNode({ ...node, interpolatedIntent: newIntent });
            },
        },
        {
            select: '[enumValueNode]',
            transform: (node, stack) => {
                assertIsNode(node, 'enumValueNode');
                const original = getLastNodeFromPath(stack.getPath('enumValueNode'));
                const definedTypePath = linkables.getPath([...stack.getPath(), original.enum]);
                const newVariant = definedTypePath
                    ? renames.definedTypeMembers?.(definedTypePath)?.get(original.variant)
                    : undefined;
                return newVariant ? enumValueNode(node.enum, newVariant, { ...node }) : node;
            },
        },
    ];
}

function getRename<TNode extends Node>(
    rename: ((path: NodePath<TNode>) => IdentifierString | undefined) | undefined,
    path: NodePath<TNode> | undefined,
): IdentifierString | undefined {
    return path ? rename?.(path) : undefined;
}

/** The new identifier of the instruction account `identifier` of the closest instruction in `path`, if renamed. */
function getInstructionAccountRename(
    path: NodePath,
    identifier: string,
    renames: RenamePlan,
): IdentifierString | undefined {
    const instructionPath = getNodePathUntilLastNode(path, 'instructionNode');
    return instructionPath ? renames.instructionAccounts?.(instructionPath)?.get(identifier) : undefined;
}

export type PathSegment = { identifier: string; kind: 'field' } | { index: number; kind: 'index' };

const PATH_SEGMENT_REGEX = /(?:^|\.)([A-Za-z_][A-Za-z0-9_]*)|\[(0|[1-9][0-9]*)\]/g;

export function parsePath(path: string): PathSegment[] {
    return [...path.matchAll(PATH_SEGMENT_REGEX)].map(([, identifier, index]) =>
        identifier !== undefined ? { identifier, kind: 'field' } : { index: Number(index), kind: 'index' },
    );
}

function serializePath(segments: PathSegment[]): string {
    return segments
        .map((segment, i) => {
            if (segment.kind === 'index') return `[${segment.index}]`;
            return i === 0 ? segment.identifier : `.${segment.identifier}`;
        })
        .join('');
}

/** The owner whose renames apply to the struct currently walked by the path resolver. */
type PathOwner =
    | { kind: 'account'; path: NodePath<AccountNode> }
    | { kind: 'definedType'; path: NodePath<DefinedTypeNode> }
    | { kind: 'instruction'; path: NodePath<InstructionNode> }
    | { kind: 'none' };

/**
 * Rewrite path expressions (e.g. `config.fee`) whose segments point to
 * renamed struct fields, walking the original types from the path's root
 * and following defined type links.
 */
function createPathResolver(renames: RenamePlan, linkables: LinkableDictionary) {
    const getFieldRename = (owner: PathOwner, prefix: string, identifier: string): IdentifierString | undefined => {
        switch (owner.kind) {
            case 'account':
                return prefix === '' ? renames.accountFields?.(owner.path)?.get(identifier) : undefined;
            case 'definedType':
                return prefix === '' ? renames.definedTypeMembers?.(owner.path)?.get(identifier) : undefined;
            case 'instruction':
                return renames.instructionFields?.(owner.path)?.get(prefix ? `${prefix}.${identifier}` : identifier);
            default:
                return undefined;
        }
    };

    const rewrite = (path: string, root: TypeNode | undefined, rootOwner: PathOwner, rootContext: NodePath): string => {
        const segments = parsePath(path);
        let type = root;
        let owner = rootOwner;
        let context = rootContext;
        let prefix = '';
        let changed = false;
        const followedDefinedTypes = new Set<DefinedTypeNode>();

        for (const segment of segments) {
            while (type && isNode(type, 'definedTypeLinkNode')) {
                const definedTypePath = linkables.getPath([...context, type]);
                const definedType = definedTypePath ? getLastNodeFromPath(definedTypePath) : undefined;
                if (!definedTypePath || !definedType || followedDefinedTypes.has(definedType)) {
                    type = undefined;
                    break;
                }
                followedDefinedTypes.add(definedType);
                owner = { kind: 'definedType', path: definedTypePath };
                context = definedTypePath;
                prefix = '';
                type = definedType.type;
            }
            if (!type) break;

            if (segment.kind === 'field') {
                if (!isNode(type, 'structTypeNode')) break;
                const field = (type.fields ?? []).find(f => f.identifier === segment.identifier);
                const newIdentifier = getFieldRename(owner, prefix, segment.identifier);
                prefix = prefix ? `${prefix}.${segment.identifier}` : segment.identifier;
                if (newIdentifier) {
                    segment.identifier = newIdentifier;
                    changed = true;
                }
                type = field?.type;
            } else {
                prefix = `${prefix}[${segment.index}]`;
                if (isNode(type, 'tupleTypeNode')) type = (type.items ?? [])[segment.index];
                else if (isNode(type, ['arrayTypeNode', 'setTypeNode'])) type = type.item;
                else break;
            }
        }

        return changed ? serializePath(segments) : path;
    };

    return {
        fromInstruction(path: string, instructionPath: NodePath<InstructionNode>): string {
            const instruction = getLastNodeFromPath(instructionPath);
            return rewrite(path, instruction.data, { kind: 'instruction', path: instructionPath }, instructionPath);
        },
        fromInstructionAccount(
            path: string,
            instructionPath: NodePath<InstructionNode>,
            instructionAccount: InstructionAccountNode,
        ): string {
            if (!instructionAccount.accountLink) return path;
            const accountPath = linkables.getPath([...instructionPath, instructionAccount.accountLink]);
            if (!accountPath) return path;
            const account = getLastNodeFromPath(accountPath);
            return rewrite(path, account.data, { kind: 'account', path: accountPath }, accountPath);
        },
        fromOwner(path: string, ownerPath: NodePath<Node>): string {
            if (isNodePath(ownerPath, 'accountNode')) {
                return rewrite(
                    path,
                    getLastNodeFromPath(ownerPath).data,
                    { kind: 'account', path: ownerPath },
                    ownerPath,
                );
            }
            if (isNodePath(ownerPath, 'instructionNode')) {
                const instruction = getLastNodeFromPath(ownerPath);
                return rewrite(path, instruction.data, { kind: 'instruction', path: ownerPath }, ownerPath);
            }
            if (isNodePath(ownerPath, 'eventNode')) {
                return rewrite(path, getLastNodeFromPath(ownerPath).data, { kind: 'none' }, ownerPath);
            }
            return path;
        },
    };
}
