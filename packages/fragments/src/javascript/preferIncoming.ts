import type { ImportInfo } from './ImportMap';

/**
 * Decide whether an incoming `ImportInfo` should replace an existing entry
 * for the same `usedIdentifier`.
 *
 * The single rule we apply: if both refer to the same source identifier and
 * one is type-only while the other is a value import, the value import wins.
 * In every other "tied" case the existing entry stays. This keeps a value
 * import from being silently downgraded to type-only when both are
 * encountered.
 *
 * Shared by `mergeImportMaps` and `addToImportMap`, and not
 * exported from `@codama/fragments/javascript`.
 */
export function preferIncoming(existing: ImportInfo | undefined, incoming: ImportInfo): boolean {
    if (!existing) return true;
    return existing.importedIdentifier === incoming.importedIdentifier && existing.isType && !incoming.isType;
}
