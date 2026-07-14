import { type Path } from '@codama/fragments/javascript';
import { isChildAttribute, type Spec } from '@codama/spec';

import {
    resolveSharedRenderOptions,
    type SharedRenderOptions,
    type SymbolicModule,
    type SymbolicModuleMap,
    validateSharedRenderOptions,
} from '../shared';

export {
    CATEGORY_DIRECTORIES,
    GENERIC_PARAM_ORDER,
    getNodeTypeParameterAttributes,
    isNodeTypeParameterAttribute,
    NARROWABLE_DATA_ATTRIBUTES,
} from '../shared';

/**
 * Map from a spec union name to the `@codama/nodes` plural-noun alias
 * the visitors should reference in `assertIsNode` /
 * `removeNullAndAssertIsNodeFilter` calls (e.g. `'typeNode'` →
 * `'TYPE_NODES'`). Unions absent from this map are expanded inline as
 * a literal kind array.
 */
export const UNION_ALIAS_NAMES: ReadonlyMap<string, string> = new Map([
    ['contextualValueNode', 'CONTEXTUAL_VALUE_NODES'],
    ['countNode', 'COUNT_NODES'],
    ['discriminatorNode', 'DISCRIMINATOR_NODES'],
    ['enumVariantTypeNode', 'ENUM_VARIANT_TYPE_NODES'],
    ['instructionInputValueNode', 'INSTRUCTION_INPUT_VALUE_NODES'],
    ['linkNode', 'LINK_NODES'],
    ['pdaSeedNode', 'PDA_SEED_NODES'],
    ['typeNode', 'TYPE_NODES'],
    ['valueNode', 'VALUE_NODES'],
]);

/**
 * Per-node override of the **merge visitor**'s child-attribute walk
 * order. The visitor walks children in spec-declaration order by
 * default; entries in this map pin a different order for nodes where
 * the historic hand-written merge visitor diverged from spec order
 * (size / count / prefix attributes typically walked first). The walk
 * order is observable through `getDebugStringVisitor`.
 *
 * Each entry must enumerate exactly the node's child attributes — no
 * missing, no extras — otherwise generation fails.
 */
export const MERGE_VISITOR_WALK_ORDER: ReadonlyMap<string, readonly string[]> = new Map([
    ['programNode', ['pdas', 'accounts', 'events', 'instructions', 'definedTypes', 'errors', 'constants']],
    [
        'instructionNode',
        [
            'status',
            'accounts',
            'arguments',
            'extraArguments',
            'remainingAccounts',
            'byteDeltas',
            'discriminators',
            'subInstructions',
            'provides',
            'display',
            'plugins',
        ],
    ],
    ['arrayTypeNode', ['count', 'item']],
    ['enumTypeNode', ['size', 'variants']],
    ['mapTypeNode', ['count', 'key', 'value']],
    ['optionTypeNode', ['prefix', 'item']],
    ['setTypeNode', ['count', 'item']],
    ['sizePrefixTypeNode', ['prefix', 'type']],
    ['sentinelTypeNode', ['sentinel', 'type']],
    ['hiddenPrefixTypeNode', ['prefix', 'type']],
]);

/**
 * Per-node override of the **identity visitor**'s child-attribute walk
 * order. The identity visitor's walk order matches the merge visitor's
 * for every node by default; entries in this map override it for the
 * handful of nodes where the historic hand-written identity visitor
 * relied on JS object-literal evaluation order (effectively
 * alphabetical) and diverges from the merge visitor's authored order.
 * The walk order is observable through `recordNodeStackVisitor` +
 * selector matching.
 *
 * Each entry must enumerate exactly the node's child attributes.
 */
export const IDENTITY_VISITOR_WALK_ORDER: ReadonlyMap<string, readonly string[]> = new Map([
    ['programNode', ['accounts', 'constants', 'definedTypes', 'errors', 'events', 'instructions', 'pdas']],
    [
        'instructionNode',
        [
            'status',
            'accounts',
            'arguments',
            'byteDeltas',
            'discriminators',
            'extraArguments',
            'remainingAccounts',
            'subInstructions',
            'provides',
            'display',
            'plugins',
        ],
    ],
]);

/** User-facing options for the `@codama/visitors-core` generator. */
export interface RenderOptions extends SharedRenderOptions {
    /**
     * Per-node override of the identity visitor's child-attribute walk
     * order. Omitted means "use the v1 defaults"
     * ({@link IDENTITY_VISITOR_WALK_ORDER}).
     */
    readonly identityVisitorWalkOrder?: ReadonlyMap<string, readonly string[]>;
    /**
     * Per-node override of the merge visitor's child-attribute walk
     * order. Omitted means "use the v1 defaults"
     * ({@link MERGE_VISITOR_WALK_ORDER}).
     */
    readonly mergeVisitorWalkOrder?: ReadonlyMap<string, readonly string[]>;
    /**
     * Map from spec union names to the `@codama/nodes` plural-noun
     * alias constants. Omitted means "use the v1 defaults"
     * ({@link UNION_ALIAS_NAMES}).
     */
    readonly unionAliasNames?: ReadonlyMap<string, string>;
}

/** Options consumed by {@link generateVisitorsCore}, the disk-writing entry point. */
export interface GenerateOptions extends RenderOptions {
    readonly outputDir: Path;
}

/** {@link RenderOptions} with every defaultable field resolved. */
export type ResolvedRenderOptions = Required<RenderOptions>;

/**
 * Runtime context threaded through every fragment renderer. Carries
 * the resolved options plus the symbolic-module lookup table.
 *
 * Symbolic-module flavours emitted by this generator:
 *
 *   - `visitor:<name>` — a sibling visitor file under `generated/`.
 *   - `helper:<name>`  — a hand-written sibling above `generated/`
 *                        (`staticVisitor`, `visit`, `Visitor`).
 *
 * Imports from `@codama/nodes` (node constructors, kind aliases,
 * assertion helpers) do NOT use this resolver: renderers call
 * `use(<identifier>, '@codama/nodes')` directly and the fragment
 * pipeline passes the bare specifier through.
 */
export interface RenderScope extends ResolvedRenderOptions {
    readonly symbolicModules: SymbolicModuleMap;
}

export function resolveRenderOptions(options: RenderOptions): ResolvedRenderOptions {
    return {
        ...resolveSharedRenderOptions(options),
        identityVisitorWalkOrder: options.identityVisitorWalkOrder ?? IDENTITY_VISITOR_WALK_ORDER,
        mergeVisitorWalkOrder: options.mergeVisitorWalkOrder ?? MERGE_VISITOR_WALK_ORDER,
        unionAliasNames: options.unionAliasNames ?? UNION_ALIAS_NAMES,
    };
}

/**
 * Cross-check the caller-supplied options against the spec at
 * generation time. Catches stale `unionAliasNames` keys, stale walk-
 * order overrides, and walk-order entries that don't match a node's
 * child-attribute set exactly.
 */
export function validateRenderOptions(spec: Spec, options: RenderOptions): void {
    validateSharedRenderOptions(spec, options);

    const allNodes = spec.categories.flatMap(c => c.nodes);
    const nodeByKind = new Map(allNodes.map(n => [n.kind, n]));
    const validUnionNames = new Set(spec.categories.flatMap(c => c.unions).map(u => u.name));

    if (options.unionAliasNames) {
        for (const unionName of options.unionAliasNames.keys()) {
            if (!validUnionNames.has(unionName)) {
                throw new Error(`unionAliasNames references unknown union "${unionName}".`);
            }
        }
    }

    const validateWalkOrder = (table: ReadonlyMap<string, readonly string[]> | undefined, tableName: string): void => {
        if (!table) return;
        for (const [kind, order] of table) {
            const node = nodeByKind.get(kind);
            if (!node) {
                throw new Error(`${tableName} references unknown node kind "${kind}".`);
            }
            const childAttrs = new Set(node.attributes.filter(a => isChildAttribute(a.type)).map(a => a.name));
            const overrideSet = new Set(order);
            const missing = [...childAttrs].filter(n => !overrideSet.has(n));
            const unknown = order.filter(n => !childAttrs.has(n));
            if (missing.length > 0 || unknown.length > 0) {
                const parts: string[] = [];
                if (missing.length > 0) parts.push(`missing child attribute(s) ${JSON.stringify(missing)}`);
                if (unknown.length > 0) parts.push(`unknown attribute(s) ${JSON.stringify(unknown)}`);
                throw new Error(`${tableName} for "${kind}" is out of sync with the spec: ${parts.join('; ')}.`);
            }
        }
    };

    validateWalkOrder(options.mergeVisitorWalkOrder, 'mergeVisitorWalkOrder');
    validateWalkOrder(options.identityVisitorWalkOrder, 'identityVisitorWalkOrder');
}

/**
 * Hand-written sibling files at `@codama/visitors-core/src/`, one
 * directory above `generated/`. Each entry's leading `../` makes the
 * relative import resolve to `'../<file>'` from a top-level generated
 * file.
 */
const HELPER_PATHS: Readonly<Record<string, Path>> = Object.freeze({
    Visitor: '../visitor',
    staticVisitor: '../staticVisitor',
    visit: '../visitor',
});

export function buildRenderScope(options: RenderOptions): RenderScope {
    const resolved = resolveRenderOptions(options);
    const symbolicModules = new Map<SymbolicModule, Path>();

    // The visitor generator emits one file per visitor; the visitor
    // symbolic flavour resolves to its sibling file under `generated/`.
    symbolicModules.set('visitor:identityVisitor', 'identityVisitor');
    symbolicModules.set('visitor:mergeVisitor', 'mergeVisitor');
    symbolicModules.set('visitor:nodeTestPaths', 'nodeTestPaths');

    for (const [name, path] of Object.entries(HELPER_PATHS)) {
        symbolicModules.set(`helper:${name}`, path);
    }

    return Object.freeze({
        ...resolved,
        symbolicModules: Object.freeze(symbolicModules),
    });
}
