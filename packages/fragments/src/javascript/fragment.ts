import type { BaseFragment } from '../core/BaseFragment';
import { createFragmentTemplate } from '../core/createFragmentTemplate';
import { addToImportMap } from './addToImportMap';
import type { ImportInput, ImportMap, Module, UsedIdentifier } from './ImportMap';
import { createImportMap, parseImportInput } from './ImportMap';
import { mergeImportMaps } from './mergeImportMaps';
import { removeFromImportMap } from './removeFromImportMap';

/**
 * The JavaScript-flavored fragment shape: {@link BaseFragment} plus a
 * symbolic {@link ImportMap} carrying the imports the content depends on.
 *
 * Fragments are frozen and composable — interpolating one into another
 * (via the {@link fragment} tag) propagates both content and imports, so
 * generators can build code top-down without threading import bookkeeping
 * through every helper.
 */
export type Fragment = BaseFragment & Readonly<{ imports: ImportMap }>;

/**
 * Type guard for the JavaScript-flavored {@link Fragment} shape.
 *
 * @param value - The value to test.
 * @return `true` when `value` is an object carrying both `content` and
 * `imports` fields. The check is structural; downstream code that layers
 * extra fields on top (e.g. a renderer's `features` set) will still match.
 */
export function isFragment(value: unknown): value is Fragment {
    return typeof value === 'object' && value !== null && 'content' in value && 'imports' in value;
}

/**
 * Tagged-template helper for composing JavaScript-flavored fragments.
 * Interpolated values may be:
 *
 *   - A {@link Fragment} — content is inlined and imports propagate.
 *   - `undefined` — rendered as the empty string (handy for optional
 *     sub-fragments).
 *   - Anything else — coerced to a string via `String(value)`.
 *
 * @param template - The template-strings array supplied by the tag call site.
 * @param items - The interpolated values, in order.
 * @return A frozen {@link Fragment} with the merged content and imports.
 *
 * @example
 * ```ts
 * import { fragment, use } from '@codama/fragments/javascript';
 *
 * const pdaLink = use('type PdaLinkNode', '../linkNodes/PdaLinkNode');
 * const body = fragment`
 *     export interface AccountNode {
 *         readonly pda?: ${pdaLink};
 *     }
 * `;
 * ```
 */
export function fragment(template: TemplateStringsArray, ...items: unknown[]): Fragment {
    return createFragmentTemplate(template, items, isFragment, mergeFragments);
}

/**
 * Combine multiple fragments into one. The merge strategy for content is
 * supplied by the caller (`mergeContent`); imports are merged automatically
 * via {@link mergeImportMaps}. Undefined inputs are skipped.
 *
 * @param fragments - The fragments to merge, in order.
 * @param mergeContent - A function that produces the final content string
 * from each surviving fragment's content.
 * @return A frozen merged {@link Fragment}.
 *
 * @example
 * ```ts
 * import { fragment, mergeFragments } from '@codama/fragments/javascript';
 *
 * const merged = mergeFragments(
 *     [fragment`a`, fragment`b`, fragment`c`],
 *     parts => parts.join(', '),
 * );
 * ```
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
 * Construct a fragment whose content is a single imported identifier and
 * whose import map carries the corresponding import statement.
 *
 * The shorthand accepted in `importInput` is the same as
 * {@link parseImportInput}'s — bare names, `type`-prefixed names, and
 * `as`-aliased names are all supported.
 *
 * @param importInput - The import shorthand (e.g. `'Foo'`, `'type Foo'`,
 * `'Foo as Bar'`).
 * @param module - The module the identifier comes from.
 * @return A frozen {@link Fragment} ready to be interpolated into other
 * fragments.
 *
 * @example
 * ```ts
 * import { use } from '@codama/fragments/javascript';
 *
 * use('PdaLinkNode', '../linkNodes/PdaLinkNode');
 * // → content: 'PdaLinkNode'
 * //   imports: { '../linkNodes/PdaLinkNode' → PdaLinkNode (value) }
 *
 * use('type Foo as Bar', './foo');
 * // → content: 'Bar'
 * //   imports: { './foo' → Foo as Bar (type-only) }
 * ```
 */
export function use(importInput: ImportInput, module: Module): Fragment {
    const info = parseImportInput(importInput);
    const empty: Fragment = Object.freeze({ content: info.usedIdentifier, imports: createImportMap() });
    return addFragmentImports(empty, module, [importInput]);
}

/**
 * Append imports to an existing fragment's import map. The fragment's
 * content and any other fields are preserved.
 *
 * @param fragment - The source fragment.
 * @param module - The module the new imports come from.
 * @param imports - The import shorthand strings to add.
 * @return A new frozen fragment with the extended import map.
 *
 * @example
 * ```ts
 * import { addFragmentImports, fragment } from '@codama/fragments/javascript';
 *
 * const f = addFragmentImports(fragment`hello`, './foo', ['Foo']);
 * ```
 */
export function addFragmentImports(fragment: Fragment, module: Module, imports: ImportInput[]): Fragment {
    return Object.freeze({
        ...fragment,
        imports: addToImportMap(fragment.imports, module, imports),
    });
}

/**
 * Merge additional import maps into an existing fragment's import map. The
 * fragment's content and any other fields are preserved.
 *
 * @param fragment - The source fragment.
 * @param importMaps - The additional maps to merge in.
 * @return A new frozen fragment with the merged import map.
 */
export function mergeFragmentImports(fragment: Fragment, importMaps: readonly ImportMap[]): Fragment {
    return Object.freeze({
        ...fragment,
        imports: mergeImportMaps([fragment.imports, ...importMaps]),
    });
}

/**
 * Drop identifiers from a fragment's import map. The fragment's content and
 * any other fields are preserved.
 *
 * @param fragment - The source fragment.
 * @param module - The module to remove identifiers from.
 * @param usedIdentifiers - The used-identifier names to drop.
 * @return A new frozen fragment with the trimmed import map.
 */
export function removeFragmentImports(fragment: Fragment, module: Module, usedIdentifiers: UsedIdentifier[]): Fragment {
    return Object.freeze({
        ...fragment,
        imports: removeFromImportMap(fragment.imports, module, usedIdentifiers),
    });
}
