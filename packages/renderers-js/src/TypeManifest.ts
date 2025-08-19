import { Fragment, fragment, mergeFragments } from './utils';

export type TypeManifest = Readonly<{
    decoder: Fragment;
    encoder: Fragment;
    isEnum: boolean;
    looseType: Fragment;
    strictType: Fragment;
    value: Fragment;
}>;

export function typeManifest(input: Partial<TypeManifest> = {}): TypeManifest {
    return Object.freeze({
        decoder: fragment(''),
        encoder: fragment(''),
        isEnum: false,
        looseType: fragment(''),
        strictType: fragment(''),
        value: fragment(''),
        ...input,
    });
}

export function mergeTypeManifests(
    manifests: TypeManifest[],
    options: {
        mergeCodecs?: (renders: string[]) => string;
        mergeTypes?: (renders: string[]) => string;
        mergeValues?: (renders: string[]) => string;
    } = {},
): TypeManifest {
    const { mergeTypes, mergeCodecs, mergeValues } = options;
    const merge = (fragmentFn: (m: TypeManifest) => Fragment, mergeFn?: (r: string[]) => string) =>
        mergeFn ? mergeFragments(manifests.map(fragmentFn), mergeFn) : fragment('');
    return Object.freeze({
        decoder: merge(m => m.decoder, mergeCodecs),
        encoder: merge(m => m.encoder, mergeCodecs),
        isEnum: false,
        looseType: merge(m => m.looseType, mergeTypes),
        strictType: merge(m => m.strictType, mergeTypes),
        value: merge(m => m.value, mergeValues),
    });
}
