import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragmentFromTemplate } from './common';

export function getTypeEncoderFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        docs?: string[];
        manifest: Pick<TypeManifest, 'encoder'>;
        name: string;
        size: number | null;
    },
): Fragment {
    const { name, manifest, nameApi, docs = [] } = scope;
    const encoderType = scope.size === undefined ? 'Encoder' : 'FixedSizeEncoder';
    return fragmentFromTemplate('typeEncoder.njk', {
        docs,
        encoderFunction: nameApi.encoderFunction(name),
        encoderType,
        looseName: nameApi.dataArgsType(name),
        manifest,
        strictName: nameApi.dataType(name),
    })
        .mergeImportsWith(manifest.encoder)
        .addImports('solanaCodecsCore', `type ${encoderType}`);
}
