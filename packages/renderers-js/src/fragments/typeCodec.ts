import type { TypeNode } from '@codama/nodes';

import { Fragment, fragment, getDocblockFragment, mergeFragments, RenderScope, TypeManifest, use } from '../utils';
import { getTypeDecoderFragment } from './typeDecoder';
import { getTypeEncoderFragment } from './typeEncoder';

export function getTypeCodecFragment(
    scope: Pick<RenderScope, 'nameApi'> & {
        codecDocs?: string[];
        decoderDocs?: string[];
        encoderDocs?: string[];
        manifest: Pick<TypeManifest, 'decoder' | 'encoder'>;
        name: string;
        node: TypeNode;
        size: number | null;
    },
): Fragment {
    const { codecDocs = [], name, nameApi } = scope;
    const codecFunction = nameApi.codecFunction(name);
    const decoderFunction = nameApi.decoderFunction(name);
    const encoderFunction = nameApi.encoderFunction(name);
    const looseName = nameApi.dataArgsType(name);
    const strictName = nameApi.dataType(name);

    const docblock = getDocblockFragment(codecDocs, true);
    const codecType = use(typeof scope.size === 'number' ? 'type FixedSizeCodec' : 'type Codec', 'solanaCodecsCore');

    return mergeFragments(
        [
            getTypeEncoderFragment({ ...scope, docs: scope.encoderDocs }),
            getTypeDecoderFragment({ ...scope, docs: scope.decoderDocs }),
            fragment`${docblock}export function ${codecFunction}(): ${codecType}<${looseName}, ${strictName}> {
    return ${use('combineCodec', 'solanaCodecsCore')}(${encoderFunction}(), ${decoderFunction}());
}`,
        ],
        renders => renders.join('\n\n'),
    );
}
