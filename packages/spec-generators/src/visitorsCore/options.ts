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
 * Spec unions the visitors reference through their `@codama/nodes`
 * `*_KINDS` constant in `assertIsNode` /
 * `removeNullAndAssertIsNodeFilter` calls (e.g. `'typeNode'` →
 * `TYPE_NODE_KINDS`). Unions absent from this set are expanded inline
 * as a literal kind array.
 */
export const KINDS_CONSTANT_UNIONS: ReadonlySet<string> = new Set([
    'contextualValueNode',
    'countNode',
    'discriminatorNode',
    'instructionInputValueNode',
    'linkNode',
    'pdaSeedNode',
    'transformNode',
    'typeNode',
    'valueNode',
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
    ['programNode', ['docs', 'pdas', 'accounts', 'events', 'instructions', 'definedTypes', 'errors', 'constants']],
    [
        'instructionNode',
        [
            'docs',
            'status',
            'accounts',
            'data',
            'returnData',
            'remainingAccounts',
            'byteDeltas',
            'discriminators',
            'subInstructions',
            'provides',
            'display',
        ],
    ],
    ['arrayTypeNode', ['count', 'item', 'transforms']],
    ['enumTypeNode', ['size', 'variants', 'transforms']],
    ['mapTypeNode', ['count', 'key', 'value', 'transforms']],
    ['optionTypeNode', ['prefix', 'item', 'transforms']],
    ['setTypeNode', ['count', 'item', 'transforms']],
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
    ['programNode', ['accounts', 'constants', 'definedTypes', 'docs', 'errors', 'events', 'instructions', 'pdas']],
    [
        'instructionNode',
        [
            'status',
            'accounts',
            'data',
            'returnData',
            'byteDeltas',
            'discriminators',
            'docs',
            'remainingAccounts',
            'subInstructions',
            'provides',
            'display',
        ],
    ],
]);

/** User-facing options for the `@codama/visitors-core` generator. */
export interface RenderOptions extends SharedRenderOptions {
    /**
     * Per-node override of the identity visitor's child-attribute walk
     * order. Omitted means "use the defaults"
     * ({@link IDENTITY_VISITOR_WALK_ORDER}).
     */
    readonly identityVisitorWalkOrder?: ReadonlyMap<string, readonly string[]>;
    /**
     * Spec unions referenced through their `@codama/nodes` `*_KINDS`
     * constant rather than expanded inline. Omitted means "use the
     * defaults" ({@link KINDS_CONSTANT_UNIONS}).
     */
    readonly kindsConstantUnions?: ReadonlySet<string>;
    /**
     * Per-node override of the merge visitor's child-attribute walk
     * order. Omitted means "use the defaults"
     * ({@link MERGE_VISITOR_WALK_ORDER}).
     */
    readonly mergeVisitorWalkOrder?: ReadonlyMap<string, readonly string[]>;
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
 * Imports from `@codama/nodes` (node constructors, kinds constants,
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
        kindsConstantUnions: options.kindsConstantUnions ?? KINDS_CONSTANT_UNIONS,
        mergeVisitorWalkOrder: options.mergeVisitorWalkOrder ?? MERGE_VISITOR_WALK_ORDER,
    };
}

/**
 * Cross-check the caller-supplied options against the spec at
 * generation time. Catches stale `kindsConstantUnions` entries, stale walk-
 * order overrides, and walk-order entries that don't match a node's
 * child-attribute set exactly.
 */
export function validateRenderOptions(spec: Spec, options: RenderOptions): void {
    validateSharedRenderOptions(spec, options);

    const allNodes = spec.categories.flatMap(c => c.nodes);
    const nodeByKind = new Map(allNodes.map(n => [n.kind, n]));
    const validUnionNames = new Set(spec.categories.flatMap(c => c.unions).map(u => u.name));

    if (options.kindsConstantUnions) {
        for (const unionName of options.kindsConstantUnions) {
            if (!validUnionNames.has(unionName)) {
                throw new Error(`kindsConstantUnions references unknown union "${unionName}".`);
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
