import type { TypeExpr } from '@codama/spec';

/**
 * Does `expr`'s type tree contain a direct `node` reference matching
 * `selfKind`? `union` references are not recursed into — they always go
 * through a named alias that breaks the cycle.
 */
export function isTypeExprSelfReferential(expr: TypeExpr, selfKind: string): boolean {
    switch (expr.kind) {
        case 'node':
            return expr.name === selfKind;
        case 'array':
            return isTypeExprSelfReferential(expr.of, selfKind);
        default:
            return false;
    }
}
