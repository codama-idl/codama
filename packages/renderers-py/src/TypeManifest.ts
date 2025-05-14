import { Fragment, fragment, mergeFragments } from './fragments';

export type TypeManifest = {
    decoder: Fragment;
    encoder: Fragment;
    isEnum: boolean;
    looseType: Fragment;
    strictType: Fragment;
    value: Fragment;
};

export function typeManifest(): TypeManifest {
    return {
        decoder: fragment(''),
        encoder: fragment(''),
        isEnum: false,
        looseType: fragment(''),
        strictType: fragment(''),
        value: fragment(''),
    };
}

export function mergeManifests(
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
    return {
        decoder: merge(m => m.decoder, mergeCodecs),
        encoder: merge(m => m.encoder, mergeCodecs),
        isEnum: false,
        looseType: merge(m => m.looseType, mergeTypes),
        strictType: merge(m => m.strictType, mergeTypes),
        value: merge(m => m.value, mergeValues),
    };
}
