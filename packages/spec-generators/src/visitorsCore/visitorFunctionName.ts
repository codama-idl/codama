/**
 * Derive the visitor function name for a spec node kind:
 * `accountNode` → `visitAccount`, `arrayTypeNode` → `visitArrayType`.
 *
 * Mirrors the runtime `getVisitFunctionName` helper exported by
 * `@codama/visitors-core/src/visitor.ts`. The runtime helper can't be
 * imported here directly — the generator must not depend on the
 * package it generates into — so this is a quiet copy of the same
 * naming rule.
 */
export function getVisitorFunctionName(nodeKind: string): string {
    const stem = nodeKind.endsWith('Node') ? nodeKind.slice(0, -4) : nodeKind;
    return `visit${stem.charAt(0).toUpperCase()}${stem.slice(1)}`;
}
