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

/**
 * The name an imported path is bound to in the consuming code: the last
 * segment of the path for a plain import (`Bar` in `use foo::Bar;`), or
 * the right-hand side of `as` for an aliased import (`Baz` in
 * `use foo::Bar as Baz;`).
 */
export type UsedIdentifier = string;

/** The local name an aliased import is bound to (the right-hand side of `as`). */
export type Alias = UsedIdentifier;

/** A single local name under which a Rust path is imported. */
export interface ImportInfo {
    readonly importedPath: ImportPath;
    readonly usedIdentifier: UsedIdentifier;
}

/**
 * The data model used by `@codama/fragments/rust` to track imports
 * symbolically until they are stringified into actual `use foo::Bar;` lines.
 *
 * Mirroring the JavaScript flavour, imports are accumulated as a
 * `ReadonlyMap<ImportPath, ReadonlyMap<UsedIdentifier, ImportInfo>>`: the
 * outer key is the fully-qualified path, the inner key is the name the
 * path is used under in the consuming code. A path can therefore be
 * imported under several local names at once, e.g. both `use crate::Mint;`
 * and `use crate::Mint as TokenMint;`, and merging maps keeps every name.
 *
 * The map is frozen and its operations are pure functions (no methods, no
 * mutation), matching the JavaScript subpath's paradigm.
 */
export type ImportMap = ReadonlyMap<ImportPath, ReadonlyMap<UsedIdentifier, ImportInfo>>;

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
    return Object.freeze(new Map());
}

/**
 * Get the name a path is bound to when imported without an alias, i.e.
 * its last `::`-separated segment.
 *
 * @param path - The Rust path being imported.
 * @return The last segment of `path`.
 *
 * @example
 * ```ts
 * getDefaultUsedIdentifier('solana_program::pubkey::Pubkey'); // 'Pubkey'
 * ```
 */
export function getDefaultUsedIdentifier(path: ImportPath): UsedIdentifier {
    const separatorIndex = path.lastIndexOf('::');
    return separatorIndex === -1 ? path : path.slice(separatorIndex + 2);
}
