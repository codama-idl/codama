export type BaseFragment = Readonly<{ content: string }>;

export function mapFragmentContent<TFragment extends BaseFragment>(
    fragment: TFragment,
    mapContent: (content: string) => string,
): TFragment {
    return setFragmentContent(fragment, mapContent(fragment.content));
}

export async function mapFragmentContentAsync<TFragment extends BaseFragment>(
    fragment: TFragment,
    mapContent: (content: string) => Promise<string>,
): Promise<TFragment> {
    return setFragmentContent(fragment, await mapContent(fragment.content));
}

export function setFragmentContent<TFragment extends BaseFragment>(fragment: TFragment, content: string): TFragment {
    return Object.freeze({ ...fragment, content });
}

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
