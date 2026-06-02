import type { BaseFragment } from './BaseFragment';

/**
 * Return a new frozen fragment whose `content` field has been replaced with
 * `content`, preserving every other field of the input fragment.
 *
 * The output keeps the input's exact concrete type (`TFragment`) so callers
 * never lose any extra fields a flavored fragment may carry (imports,
 * features, etc.).
 *
 * @typeParam TFragment - The concrete fragment type. Must extend {@link BaseFragment}.
 * @param fragment - The source fragment to copy.
 * @param content - The new code string.
 * @return A frozen fragment of the same shape as `fragment` with `content` replaced.
 *
 * @example
 * ```ts
 * import { setFragmentContent } from '@codama/fragments';
 *
 * const next = setFragmentContent(prev, prev.content.toUpperCase());
 * ```
 */
export function setFragmentContent<TFragment extends BaseFragment>(fragment: TFragment, content: string): TFragment {
    return Object.freeze({ ...fragment, content });
}
