import type { BaseFragment } from './BaseFragment';

/**
 * Generic template-tag implementation used by every flavor's `fragment`
 * tagged template.
 *
 * Walks the template/items pair, interpolating fragments verbatim and
 * coercing other values to strings, then defers to the caller-provided
 * `mergeFragments` for combining the surviving sub-fragments. This keeps the
 * fragment shape (imports, features, etc.) opaque to the core layer; each
 * flavor plugs in its own merge logic.
 *
 * Most consumers never call this directly — they use the `fragment` tag
 * exported by `@codama/fragments/javascript` or `@codama/fragments/rust`,
 * which both wrap this helper.
 *
 * @typeParam TFragment - The concrete fragment type. Must extend {@link BaseFragment}.
 * @param template - The template-strings array supplied by the tag call site.
 * @param items - The interpolated values, in order. May be fragments,
 * strings, numbers, booleans, `undefined`, or anything coercible to a string.
 * @param isFragment - A predicate that identifies values of the concrete
 * fragment type so they can be inlined and forwarded to the merger.
 * @param mergeFragments - The flavor-specific merger that knows how to
 * combine fragments' non-content fields (e.g. imports, features). Receives
 * only the sub-fragments found in the template, plus a callback that
 * produces the final merged content string from each sub-fragment's content.
 * @return The fragment produced by `mergeFragments`.
 *
 * @example
 * ```ts
 * import { createFragmentTemplate } from '@codama/fragments';
 *
 * function fragment(template: TemplateStringsArray, ...items: unknown[]) {
 *     return createFragmentTemplate(template, items, isFragment, mergeFragments);
 * }
 * ```
 */
export function createFragmentTemplate<TFragment extends BaseFragment>(
    template: TemplateStringsArray,
    items: unknown[],
    isFragment: (value: unknown) => value is TFragment,
    mergeFragments: (fragments: TFragment[], mergeContent: (contents: string[]) => string) => TFragment,
): TFragment {
    const fragments = items.filter(isFragment);
    const zippedItems = items.map((item, i) => {
        const itemPrefix = template[i];
        if (typeof item === 'undefined') return itemPrefix;
        if (isFragment(item)) return itemPrefix + item.content;
        return itemPrefix + String(item as string);
    });
    return mergeFragments(fragments, () => zippedItems.join('') + template[template.length - 1]);
}
