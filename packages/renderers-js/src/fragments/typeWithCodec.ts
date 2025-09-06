import type { TypeNode } from '@codama/nodes';

import { TypeManifest } from '../TypeManifest';
import { Fragment, mergeFragments, RenderScope } from '../utils';
import { getTypeFragment } from './type';
import { getTypeCodecFragment } from './typeCodec';

export function getTypeWithCodecFragment(
    scope: Pick<RenderScope, 'nameApi'> & {
        codecDocs?: string[];
        decoderDocs?: string[];
        encoderDocs?: string[];
        manifest: TypeManifest;
        name: string;
        node: TypeNode;
        size: number | null;
        typeDocs?: string[];
    },
): Fragment {
    return mergeFragments([getTypeFragment({ ...scope, docs: scope.typeDocs }), getTypeCodecFragment(scope)], renders =>
        renders.join('\n\n'),
    );
}
