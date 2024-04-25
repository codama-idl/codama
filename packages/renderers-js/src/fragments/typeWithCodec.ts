import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, mergeFragments } from './common';
import { getTypeFragment } from './type';
import { getTypeCodecFragment } from './typeCodec';

export function getTypeWithCodecFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        codecDocs?: string[];
        decoderDocs?: string[];
        encoderDocs?: string[];
        manifest: TypeManifest;
        name: string;
        typeDocs?: string[];
    },
): Fragment {
    return mergeFragments([getTypeFragment({ ...scope, docs: scope.typeDocs }), getTypeCodecFragment(scope)], renders =>
        renders.join('\n\n'),
    );
}
