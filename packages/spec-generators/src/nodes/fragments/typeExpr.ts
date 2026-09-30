/**
 * Render a spec {@link TypeExpr} as a TypeScript type expression
 * suitable for an `XxxNodeInput` declaration in `@codama/nodes`.
 *
 * Named references (`node`, `union`, `enumeration`) and brand-flavoured
 * strings all resolve to identifiers exported from `@codama/node-types`.
 * Array types render as `Array<T>` rather than `T[]` to keep the
 * renderer free of precedence-aware parenthesisation.
 */

import { type Fragment, fragment, pascalCase, use } from '@codama/fragments/javascript';
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
            return fragment`number`;
        case 'boolean':
            return fragment`boolean`;
        case 'json':
            return fragment`unknown`;
        case 'literal':
            return fragment`${literalToTs(expr.value)}`;
        case 'literalUnion':
            return fragment`${renderLiteralUnion(expr.values)}`;
        case 'codamaVersion':
            return use('type CodamaVersion', NODE_TYPES_PACKAGE);
        case 'docs':
        case 'text': {
            // `docs` and `text` are the same shape — the union `string |
            // textNode`. `docs` is a documentation-intent-tagged `text`.
            const textNode = use('type TextNode', NODE_TYPES_PACKAGE);
            return fragment`string | ${textNode}`;
        }
        case 'enumeration':
        case 'node':
        case 'union':
            return use(`type ${pascalCase(expr.name)}`, NODE_TYPES_PACKAGE);
        case 'array': {
            const inner = getTypeExprFragment(expr.of);
            return fragment`Array<${inner}>`;
        }
    }
}

function getStringExprFragment(expr: Extract<TypeExpr, { kind: 'string' }>): Fragment {
    switch (expr.constraint) {
        case 'identifier':
            return use('type IdentifierString', NODE_TYPES_PACKAGE);
        case 'namespace':
            return use('type NamespaceString', NODE_TYPES_PACKAGE);
        case 'path':
            return use('type PathString', NODE_TYPES_PACKAGE);
        case 'integer':
            return use('type IntegerString', NODE_TYPES_PACKAGE);
        case 'decimal':
            return use('type DecimalString', NODE_TYPES_PACKAGE);
        case 'version':
            return use('type Version', NODE_TYPES_PACKAGE);
        case undefined:
            return fragment`string`;
    }
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
