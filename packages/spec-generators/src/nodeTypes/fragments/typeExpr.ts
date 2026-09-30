import { type Fragment, fragment, pascalCase, use } from '@codama/fragments/javascript';
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
        case 'text': {
            // `docs` and `text` are the same shape — the union `string |
            // textNode`. `docs` is a documentation-intent-tagged `text`.
            const textNode = use('type TextNode', 'node:textNode');
            return fragment`string | ${textNode}`;
        }
        case 'enumeration':
            return use(`type ${pascalCase(expr.name)}`, `enumeration:${expr.name}`);
        case 'node':
            return use(`type ${pascalCase(expr.name)}`, `node:${expr.name}`);
        case 'union':
            return use(`type ${pascalCase(expr.name)}`, `union:${expr.name}`);
        case 'array': {
            const inner = getTypeExprFragment(expr.of);
            return fragment`Array<${inner}>`;
        }
    }
}

/**
 * Like {@link getTypeExprFragment} but substitutes `selfAlias` for any
 * direct `node` reference matching `selfKind`. `union` references are
 * not recursed into — their named alias already breaks the cycle on
 * the TS side.
 */
export function getTypeExprWithSelfAliasFragment(expr: TypeExpr, selfKind: string, selfAlias: string): Fragment {
    switch (expr.kind) {
        case 'node':
            return expr.name === selfKind ? fragment`${selfAlias}` : getTypeExprFragment(expr);
        case 'array': {
            const inner = getTypeExprWithSelfAliasFragment(expr.of, selfKind, selfAlias);
            return fragment`Array<${inner}>`;
        }
        default:
            return getTypeExprFragment(expr);
    }
}

function getStringExprFragment(expr: Extract<TypeExpr, { kind: 'string' }>): Fragment {
    switch (expr.constraint) {
        case 'identifier':
            return use('type IdentifierString', 'brand:IdentifierString');
        case 'namespace':
            return use('type NamespaceString', 'brand:NamespaceString');
        case 'path':
            return use('type PathString', 'brand:PathString');
        case 'integer':
            return use('type IntegerString', 'brand:IntegerString');
        case 'decimal':
            return use('type DecimalString', 'brand:DecimalString');
        case 'version':
            return use('type Version', 'version:Version');
        case undefined:
            return fragment`string`;
    }
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
