/**
 * Render a spec {@link TypeExpr} as a TypeScript type expression
 * suitable for an `XxxNodeInput` declaration in `@codama/nodes`.
 *
 * Named references (`node`, `union`, `enumeration`, `nestedUnion`) and
 * brand-flavoured strings all resolve to identifiers exported from
 * `@codama/node-types`. Array types render as `Array<T>` rather than
 * `T[]` to keep the renderer free of precedence-aware parenthesisation.
 */

import { type Fragment, fragment, mergeFragments, pascalCase, use } from '@codama/fragments/javascript';
import type { TypeExpr } from '@codama/spec';

const NODE_TYPES_PACKAGE = '@codama/node-types';

export function getTypeExprFragment(expr: TypeExpr): Fragment {
    switch (expr.kind) {
        case 'address':
            return fragment`string`;
        case 'anyNode':
            return use('type Node', NODE_TYPES_PACKAGE);
        case 'string':
            return getStringExprFragment(expr);
        case 'integer':
        case 'float':
            return fragment`number`;
        case 'boolean':
            return fragment`boolean`;
        case 'literal':
            return fragment`${literalToTs(expr.value)}`;
        case 'literalUnion':
            return fragment`${renderLiteralUnion(expr.values)}`;
        case 'codamaVersion':
            return use('type CodamaVersion', NODE_TYPES_PACKAGE);
        case 'docs':
            return use('type Docs', NODE_TYPES_PACKAGE);
        case 'enumeration':
        case 'node':
        case 'union':
            return use(`type ${pascalCase(expr.name)}`, NODE_TYPES_PACKAGE);
        case 'nestedUnion': {
            const wrapper = use(`type ${pascalCase(expr.alias)}`, NODE_TYPES_PACKAGE);
            const inner = use(`type ${pascalCase(expr.name)}`, NODE_TYPES_PACKAGE);
            return fragment`${wrapper}<${inner}>`;
        }
        case 'array': {
            const inner = getTypeExprFragment(expr.of);
            return fragment`Array<${inner}>`;
        }
        case 'tuple': {
            if (expr.items.length === 0) return fragment`[]`;
            const items = expr.items.map(item => getTypeExprFragment(item));
            return mergeFragments(items, parts => `[${parts.join(', ')}]`);
        }
    }
}

function getStringExprFragment(expr: Extract<TypeExpr, { kind: 'string' }>): Fragment {
    if (!expr.constraint) return fragment`string`;
    if (expr.constraint === 'identifier') {
        return use('type CamelCaseString', NODE_TYPES_PACKAGE);
    }
    if (expr.constraint === 'version') {
        return use('type Version', NODE_TYPES_PACKAGE);
    }
    return fragment`string`;
}

function literalToTs(value: boolean | number | string): string {
    return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

function renderLiteralUnion(values: readonly (boolean | number | string)[]): string {
    const hasTrue = values.includes(true);
    const hasFalse = values.includes(false);
    if (hasTrue && hasFalse) {
        const rest = values.filter(v => v !== true && v !== false).map(literalToTs);
        return ['boolean', ...rest].join(' | ');
    }
    return values.map(literalToTs).join(' | ');
}
