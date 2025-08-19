export type BaseFragment = Readonly<{ content: string }>;

export function mapFragmentContent<TFragment extends BaseFragment>(
    fragment: TFragment,
    mapContent: (content: string) => string,
): TFragment {
    return setFragmentContent(fragment, mapContent(fragment.content));
}

export function setFragmentContent<TFragment extends BaseFragment>(fragment: TFragment, content: string): TFragment {
    return Object.freeze({ ...fragment, content });
}
