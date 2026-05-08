/**
 * Rust crate keywords that should never be reported as external dependencies.
 *
 * {@link getExternalDependencies} filters these out when computing the
 * package's Cargo dependencies from the imports actually used. They
 * correspond to paths that resolve inside the crate or to the standard
 * library.
 */
export const RUST_CORE_IMPORTS: ReadonlySet<string> = new Set([
    'alloc',
    'clippy',
    'core',
    'crate',
    'self',
    'std',
    'super',
]);

/**
 * The fully-qualified Rust path of an imported item — e.g.
 * `'solana_program::pubkey::Pubkey'` or `'crate::generated::accounts::AccountNode'`.
 *
 * Symbolic prefixes (e.g. `'generated::accounts::Foo'`) are accepted too;
 * they are resolved into concrete paths by {@link resolveImportMap} just
 * before stringification.
 */
export type ImportPath = string;

/** The local name an imported path is bound to (the right-hand side of `as`). */
export type Alias = string;

/** A parsed Rust import. */
export interface ImportInfo {
    readonly alias?: Alias;
    readonly importedPath: ImportPath;
}

/**
 * The data model used by `@codama/fragments/rust` to track imports
 * symbolically until they are stringified into actual `use foo::Bar;` lines.
 *
 * Unlike the JavaScript flavor, Rust's `use` statement always references a
 * single fully-qualified path. There is no per-module identifier list, so
 * the map is flat: keyed by the imported path, with optional alias info as
 * the value.
 *
 * The map is frozen and its operations are pure functions (no methods, no
 * mutation), matching the JavaScript subpath's paradigm.
 */
export type ImportMap = ReadonlyMap<ImportPath, ImportInfo>;

/**
 * Construct an empty, frozen import map.
 *
 * @return A new {@link ImportMap} with no entries.
 *
 * @example
 * ```ts
 * import { createImportMap } from '@codama/fragments/rust';
 *
 * const empty = createImportMap();
 * ```
 */
export function createImportMap(): ImportMap {
    return Object.freeze(new Map<ImportPath, ImportInfo>());
}
