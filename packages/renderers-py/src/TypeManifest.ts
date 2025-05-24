import { Fragment, fragment, mergeFragments } from './fragments';
export type TypeManifest = {
    borshType: Fragment;
    fromJSON: Fragment;
    fromDecode: Fragment;
    isEnum: boolean;
    pyJSONType: Fragment;
    pyType: Fragment;
    //strictType: Fragment;
    toJSON: Fragment;
    value: Fragment;
};
export function typeManifest(): TypeManifest {
    return {
        borshType: fragment(''),
        fromJSON: fragment(''),
        fromDecode:fragment(''),
        isEnum: false,
        pyJSONType: fragment(''),
        pyType: fragment(''),
        toJSON: fragment(''),
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
        fromJSON: merge(m => m.fromJSON, mergeValues),
        fromDecode:merge(m => m.fromDecode, mergeValues),
        isEnum: false,
        pyJSONType: merge(m => m.pyJSONType, mergeTypes),
        pyType: merge(m => m.pyType, mergeTypes),
        toJSON: merge(m => m.toJSON, mergeValues),
        value: merge(m => m.value, mergeValues),
    };
}
