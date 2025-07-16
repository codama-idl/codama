import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragmentFromTemplate } from './common';

export function getTypeDecoderFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        docs?: string[];
        manifest: Pick<TypeManifest, 'decoder'>;
        name: string;
        size: number | null;
    },
): Fragment {
    const { name, manifest, nameApi, docs = [] } = scope;
    const decoderType = typeof scope.size === 'number' ? 'FixedSizeDecoder' : 'Decoder';
    return fragmentFromTemplate('typeDecoder.njk', {
        decoderFunction: nameApi.decoderFunction(name),
        decoderType,
        docs,
        looseName: nameApi.dataArgsType(name),
        manifest,
        strictName: nameApi.dataType(name),
    })
        .mergeImportsWith(manifest.decoder)
        .addImports('solanaCodecsCore', `type ${decoderType}`);
}
