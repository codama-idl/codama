import type { BaseFragment } from './BaseFragment';
import { setFragmentContent } from './setFragmentContent';

/**
 * Apply a synchronous transformation to a fragment's `content`, returning a
 * new fragment with every other field preserved.
 *
 * @typeParam TFragment - The concrete fragment type. Must extend {@link BaseFragment}.
 * @param fragment - The source fragment.
 * @param mapContent - A function that receives the current content and
 * returns the new content.
 * @return A frozen fragment with the transformed content.
 *
 * @example
 * ```ts
 * import { mapFragmentContent } from '@codama/fragments';
 *
 * const trimmed = mapFragmentContent(fragment, c => c.trimEnd());
 * ```
 *
 * @see {@link mapFragmentContentAsync} for the async variant.
 */
export function mapFragmentContent<TFragment extends BaseFragment>(
    fragment: TFragment,
    mapContent: (content: string) => string,
): TFragment {
    return setFragmentContent(fragment, mapContent(fragment.content));
}

/**
 * Async variant of {@link mapFragmentContent}: apply an async transformation
 * to a fragment's `content`.
 *
 * @typeParam TFragment - The concrete fragment type. Must extend {@link BaseFragment}.
 * @param fragment - The source fragment.
 * @param mapContent - An async function that receives the current content
 * and returns a promise resolving to the new content.
 * @return A promise that resolves to a frozen fragment with the transformed
 * content.
 *
 * @example
 * ```ts
 * import { mapFragmentContentAsync } from '@codama/fragments';
 *
 * const formatted = await mapFragmentContentAsync(fragment, formatWithPrettier);
 * ```
 *
 * @see {@link mapFragmentContent} for the sync variant.
 */
export async function mapFragmentContentAsync<TFragment extends BaseFragment>(
    fragment: TFragment,
    mapContent: (content: string) => Promise<string>,
): Promise<TFragment> {
    return setFragmentContent(fragment, await mapContent(fragment.content));
}
