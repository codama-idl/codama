import { type Fragment, fragment, use } from '@codama/fragments/javascript';
import { type AttributeSpec, type Spec } from '@codama/spec';

import { type NodeConstructorConfig } from '../../nodes';
import { paramIdentifier } from '../../nodes/paramIdentifier';
import { type ResolvedRenderOptions } from '../options';
import { getChildShape } from '../walkStep';
import { getUnionKindListFragment } from './unionConstant';

/**
 * The two pieces an identity-visitor body needs for one attribute:
 *
 *   - `preStatement`: a hoisted statement (or block of statements) that
 *     visits the child and asserts its kind. Single-node visits return
 *     `null` from the surrounding visitor when the visit yields `null`;
 *     optional single-node visits collapse `null` into `undefined`.
 *     Array visits have no pre-statement (the work lives inline in the
 *     rebuild expression).
 *   - `rebuildExpr`: the JS expression that names the visited value in
 *     the constructor call's rebuild block. For data attributes this is
 *     `node.<name>`; for visited single-node children it's the local
 *     name introduced by `preStatement`; for visited arrays it's the
 *     `.map(...).filter(...)` chain (or its optional `?: undefined`
 *     wrapper) inlined.
 *
 * Required arrays uniformly emit `(node.<x> ?? [])` rather than
 * `node.<x>` — defensive against partial IDL JSON, matching the
 * identity-visitor contract that any required-array child reference
 * tolerates `undefined` at runtime.
 */
interface IdentityWalkStep {
    readonly preStatement: Fragment | undefined;
    readonly rebuildExpr: Fragment;
}

/** Build the walk step fragments for one attribute. */
export function getIdentityWalkStep(
    attr: AttributeSpec,
    config: NodeConstructorConfig | undefined,
    spec: Spec,
    options: Pick<ResolvedRenderOptions, 'unionAliasNames'>,
): IdentityWalkStep {
    const localName = getSafeLocalName(attr, config);
    const fieldAccess = `node.${attr.name}`;
    const shape = getChildShape(attr.type);
    const optional = attr.optional === true;
    const visitThis = fragment`visit(this)`;

    switch (shape.kind) {
        case 'data':
            return { preStatement: undefined, rebuildExpr: fragment`${fieldAccess}` };

        case 'node':
            return buildSingleNodeStep(localName, fieldAccess, optional, {
                assertCall: use('assertIsNode', '@codama/nodes'),
                kindArg: fragment`'${shape.nodeKind}'`,
                visitThis,
            });

        case 'nestedNode':
            return buildSingleNodeStep(localName, fieldAccess, optional, {
                assertCall: use('assertIsNestedTypeNode', '@codama/nodes'),
                kindArg: fragment`'${shape.nodeKind}'`,
                visitThis,
            });

        case 'union':
            return buildSingleNodeStep(localName, fieldAccess, optional, {
                assertCall: use('assertIsNode', '@codama/nodes'),
                kindArg: getUnionKindListFragment(shape.unionName, spec, options),
                visitThis,
            });

        case 'arrayNode': {
            const filterCall = use('removeNullAndAssertIsNodeFilter', '@codama/nodes');
            return buildArrayStep(fieldAccess, optional, {
                filterArg: fragment`'${shape.nodeKind}'`,
                filterCall,
                visitThis,
            });
        }

        case 'arrayUnion': {
            const filterCall = use('removeNullAndAssertIsNodeFilter', '@codama/nodes');
            return buildArrayStep(fieldAccess, optional, {
                filterArg: getUnionKindListFragment(shape.unionName, spec, options),
                filterCall,
                visitThis,
            });
        }
    }
}

/**
 * The safe TS identifier for an attribute's local in the visitor body.
 * Defaults to the attribute name; if that collides with a TS reserved
 * word, looks up the `paramName` override in the node's config (the
 * same field that the `@codama/nodes` constructor generator uses for
 * its positional parameter renaming).
 */
function getSafeLocalName(attr: AttributeSpec, config: NodeConstructorConfig | undefined): string {
    return paramIdentifier(attr, config?.attributes?.[attr.name]);
}

function buildSingleNodeStep(
    localName: string,
    fieldAccess: string,
    optional: boolean,
    deps: { readonly assertCall: Fragment; readonly kindArg: Fragment; readonly visitThis: Fragment },
): IdentityWalkStep {
    const { assertCall, kindArg, visitThis } = deps;
    if (optional) {
        const preStatement = fragment`const ${localName} = ${fieldAccess} ? (${visitThis}(${fieldAccess}) ?? undefined) : undefined;\nif (${localName}) ${assertCall}(${localName}, ${kindArg});`;
        return { preStatement, rebuildExpr: fragment`${localName}` };
    }
    const preStatement = fragment`const ${localName} = ${visitThis}(${fieldAccess});\nif (${localName} === null) return null;\n${assertCall}(${localName}, ${kindArg});`;
    return { preStatement, rebuildExpr: fragment`${localName}` };
}

function buildArrayStep(
    fieldAccess: string,
    optional: boolean,
    deps: { readonly filterArg: Fragment; readonly filterCall: Fragment; readonly visitThis: Fragment },
): IdentityWalkStep {
    const { filterArg, filterCall, visitThis } = deps;
    if (optional) {
        const expr = fragment`${fieldAccess} ? ${fieldAccess}.map(${visitThis}).filter(${filterCall}(${filterArg})) : undefined`;
        return { preStatement: undefined, rebuildExpr: expr };
    }
    // Defensive `?? []` on every required-array child attribute — the
    // identity visitor tolerates `undefined` at runtime so it can
    // safely normalise a partial IDL JSON parsed via `createFromJson`.
    const expr = fragment`(${fieldAccess} ?? []).map(${visitThis}).filter(${filterCall}(${filterArg}))`;
    return { preStatement: undefined, rebuildExpr: expr };
}
