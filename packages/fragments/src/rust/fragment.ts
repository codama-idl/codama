import type { BaseFragment } from '../core/BaseFragment';
import { createFragmentTemplate } from '../core/createFragmentTemplate';
import { addAliasToImportMap } from './addAliasToImportMap';
import { addToImportMap } from './addToImportMap';
import type { Alias, ImportMap, ImportPath } from './ImportMap';
import { mergeImportMaps } from './mergeImportMaps';
import { removeFromImportMap } from './removeFromImportMap';

/**
 * The Rust-flavored fragment shape: {@link BaseFragment} plus a frozen
 * {@link ImportMap} carrying the `use` paths the content depends on.
 *
 * Both the fragment and its import map are immutable. Every operation in
 * this subpath that returns a fragment produces a new frozen wrapper, so
 * fragments compose without aliasing risks.
 */
export type Fragment = BaseFragment & Readonly<{ imports: ImportMap }>;

/**
 * Type guard for the Rust-flavored {@link Fragment} shape.
 *
 * @param value - The value to test.
 * @return `true` when `value` is an object carrying both `content` and
 * `imports` fields.
 */
export function isFragment(value: unknown): value is Fragment {
    return typeof value === 'object' && value !== null && 'content' in value && 'imports' in value;
}

/**
 * Tagged-template helper for composing Rust-flavored fragments.
 * Interpolated values may be:
 *
 *   - A {@link Fragment} — content is inlined and imports propagate.
 *   - `undefined` — rendered as the empty string.
 *   - Anything else — coerced to a string via `String(value)`.
 *
 * Rust does not have a `use(input, module)` shorthand because identifiers
 * can be referenced inline by their full `::`-qualified path; build
 * content with the tag and attach imports separately via
 * {@link addFragmentImports}.
 *
 * @param template - The template-strings array supplied by the tag call site.
 * @param items - The interpolated values, in order.
 * @return A frozen {@link Fragment} with merged content and imports.
 *
 * @example
 * ```ts
 * import { addFragmentImports, fragment } from '@codama/fragments/rust';
 *
 * const body = fragment`pub struct AccountNode { pubkey: Pubkey }`;
 * const withImports = addFragmentImports(body, ['solana_program::pubkey::Pubkey']);
 * ```
 */
export function fragment(template: TemplateStringsArray, ...items: unknown[]): Fragment {
    return createFragmentTemplate(template, items, isFragment, mergeFragments);
}

/**
 * Combine multiple fragments into one. The merge strategy for content is
 * supplied by the caller (`mergeContent`); imports are merged
 * automatically via {@link mergeImportMaps}. Undefined inputs are skipped.
 *
 * @param fragments - The fragments to merge, in order.
 * @param mergeContent - A function that produces the final content string
 * from each surviving fragment's content.
 * @return A frozen merged {@link Fragment}.
 */
export function mergeFragments(
    fragments: readonly (Fragment | undefined)[],
    mergeContent: (contents: string[]) => string,
): Fragment {
    const filtered = fragments.filter((f): f is Fragment => f !== undefined);
    return Object.freeze({
        content: mergeContent(filtered.map(f => f.content)),
        imports: mergeImportMaps(filtered.map(f => f.imports)),
    });
}

/**
 * Append imports to an existing fragment's import map. The fragment's
 * content and any other fields are preserved.
 *
 * @param fragment - The source fragment.
 * @param paths - The Rust paths to add. May be a single string, an array,
 * or a {@link Set}.
 * @return A new frozen fragment with the extended import map.
 *
 * @example
 * ```ts
 * import { addFragmentImports, fragment } from '@codama/fragments/rust';
 *
 * const f = addFragmentImports(fragment`Pubkey`, ['solana_program::pubkey::Pubkey']);
 * ```
 */
export function addFragmentImports(
    fragment: Fragment,
    paths: ImportPath | ReadonlySet<string> | readonly ImportPath[],
): Fragment {
    return Object.freeze({
        ...fragment,
        imports: addToImportMap(fragment.imports, paths),
    });
}

/**
 * Record an alias for an imported path on the fragment's import map. If
 * the path isn't yet imported, it is added; if it's already present, the
 * alias replaces any existing one. The fragment's content and any other
 * fields are preserved.
 *
 * @param fragment - The source fragment.
 * @param path - The full Rust path being aliased.
 * @param alias - The local name to use.
 * @return A new frozen fragment with the alias recorded.
 *
 * @example
 * ```ts
 * import { addFragmentImportAlias, fragment } from '@codama/fragments/rust';
 *
 * const f = addFragmentImportAlias(
 *     fragment`ProgError::InvalidArgument`,
 *     'solana_program::program_error::ProgramError',
 *     'ProgError',
 * );
 * ```
 */
export function addFragmentImportAlias(fragment: Fragment, path: ImportPath, alias: Alias): Fragment {
    return Object.freeze({
        ...fragment,
        imports: addAliasToImportMap(fragment.imports, path, alias),
    });
}

/**
 * Merge additional import maps into an existing fragment's import map.
 * The fragment's content and any other fields are preserved.
 *
 * @param fragment - The source fragment.
 * @param importMaps - The maps to merge in.
 * @return A new frozen fragment with the merged import map.
 */
export function mergeFragmentImports(fragment: Fragment, importMaps: readonly ImportMap[]): Fragment {
    return Object.freeze({
        ...fragment,
        imports: mergeImportMaps([fragment.imports, ...importMaps]),
    });
}

/**
 * Drop paths from a fragment's import map. The fragment's content and any
 * other fields are preserved.
 *
 * @param fragment - The source fragment.
 * @param paths - The Rust paths to remove. May be a single string, an
 * array, or a {@link Set}.
 * @return A new frozen fragment with the trimmed import map.
 */
export function removeFragmentImports(
    fragment: Fragment,
    paths: ImportPath | ReadonlySet<string> | readonly ImportPath[],
): Fragment {
    return Object.freeze({
        ...fragment,
        imports: removeFromImportMap(fragment.imports, paths),
    });
}
