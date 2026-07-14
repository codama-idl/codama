import { type Fragment, fragment, mergeFragments, pascalCase, use } from '@codama/fragments/javascript';
import type { TypeExpr } from '@codama/spec';

export function getTypeExprFragment(expr: TypeExpr): Fragment {
    switch (expr.kind) {
        case 'address':
            return fragment`string`;
        case 'anyNode':
            return use('type Node', 'registry:Node');
        case 'string':
            return getStringExprFragment(expr);
        case 'integer':
        case 'float':
            return fragment`number`;
        case 'boolean':
            return fragment`boolean`;
        case 'json':
            return fragment`unknown`;
        case 'literal':
            return fragment`${literalToTs(expr.value)}`;
        case 'literalUnion':
            return fragment`${formatLiteralUnionTs(expr.values)}`;
        case 'codamaVersion':
            return use('type CodamaVersion', 'version:CodamaVersion');
        case 'docs':
            return use('type Docs', 'docs:Docs');
        case 'enumeration':
            return use(`type ${pascalCase(expr.name)}`, `enumeration:${expr.name}`);
        case 'node':
            return use(`type ${pascalCase(expr.name)}`, `node:${expr.name}`);
        case 'union':
            return use(`type ${pascalCase(expr.name)}`, `union:${expr.name}`);
        case 'nestedUnion': {
            const wrapper = use(`type ${pascalCase(expr.alias)}`, `nestedUnion:${expr.alias}`);
            const inner = use(`type ${pascalCase(expr.name)}`, `node:${expr.name}`);
            return fragment`${wrapper}<${inner}>`;
        }
        case 'array': {
            const inner = getTypeExprFragment(expr.of);
            return fragment`Array<${inner}>`;
        }
        case 'tuple': {
            const items = expr.items.map(item => getTypeExprFragment(item));
            return mergeFragments(items, parts => `[${parts.join(', ')}]`);
        }
    }
}

/**
 * Like {@link getTypeExprFragment} but substitutes `selfAlias` for any
 * direct `node` reference matching `selfKind`. `union` / `nestedUnion`
 * references are not recursed into — their named alias already breaks
 * the cycle on the TS side.
 */
export function getTypeExprWithSelfAliasFragment(expr: TypeExpr, selfKind: string, selfAlias: string): Fragment {
    switch (expr.kind) {
        case 'node':
            return expr.name === selfKind ? fragment`${selfAlias}` : getTypeExprFragment(expr);
        case 'array': {
            const inner = getTypeExprWithSelfAliasFragment(expr.of, selfKind, selfAlias);
            return fragment`Array<${inner}>`;
        }
        case 'tuple': {
            const items = expr.items.map(item => getTypeExprWithSelfAliasFragment(item, selfKind, selfAlias));
            return mergeFragments(items, parts => `[${parts.join(', ')}]`);
        }
        default:
            return getTypeExprFragment(expr);
    }
}

function getStringExprFragment(expr: Extract<TypeExpr, { kind: 'string' }>): Fragment {
    if (!expr.constraint) return fragment`string`;
    if (expr.constraint === 'identifier') {
        return use('type CamelCaseString', 'brand:CamelCaseString');
    }
    if (expr.constraint === 'version') {
        return use('type Version', 'version:Version');
    }
    return fragment`string`;
}

function literalToTs(value: boolean | number | string): string {
    return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

/**
 * Render a `literalUnion`'s values as a `|`-separated TS expression,
 * collapsing `true | false` to `boolean` (placed first) as a TS-only
 * readability normalisation.
 */
function formatLiteralUnionTs(values: readonly (boolean | number | string)[]): string {
    const hasTrue = values.includes(true);
    const hasFalse = values.includes(false);
    if (hasTrue && hasFalse) {
        const rest = values.filter(v => v !== true && v !== false).map(literalToTs);
        return ['boolean', ...rest].join(' | ');
    }
    return values.map(literalToTs).join(' | ');
}
