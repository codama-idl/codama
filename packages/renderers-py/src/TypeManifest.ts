import { Fragment, fragment, mergeFragments } from './fragments';
export type TypeManifest = {
    borshType: Fragment;
    isEnum: boolean;
    pyJSONType: Fragment;
    pyType: Fragment;
    strictType: Fragment;
    value: Fragment;
    toJSON: Fragment,
    fromJSON: Fragment,

};
export function typeManifest(): TypeManifest {
    return {
        isEnum: false,
        borshType: fragment(''),
        pyJSONType: fragment(''),
        pyType: fragment(''),
        strictType: fragment(''),
        toJSON: fragment(''),
        fromJSON: fragment(''),
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
    const { mergeTypes, mergeValues } = options;
    const merge = (fragmentFn: (m: TypeManifest) => Fragment, mergeFn?: (r: string[]) => string) =>
        mergeFn ? mergeFragments(manifests.map(fragmentFn), mergeFn) : fragment('');
    return {
        borshType: merge(m => m.borshType, mergeTypes),
        isEnum: false,
        pyJSONType: merge(m => m.pyJSONType, mergeTypes),
        pyType: merge(m => m.pyType, mergeTypes),
        strictType: merge(m => m.strictType, mergeTypes),
        value: merge(m => m.value, mergeValues),
        toJSON: merge(m => m.toJSON, mergeValues),
        fromJSON: merge(m => m.fromJSON, mergeValues),
    };
}
