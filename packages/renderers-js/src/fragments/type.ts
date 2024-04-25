import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragmentFromTemplate } from './common';

export function getTypeFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        docs?: string[];
        manifest: TypeManifest;
        name: string;
    },
): Fragment {
    const { name, manifest, nameApi, docs = [] } = scope;
    const typeFragment = fragmentFromTemplate('type.njk', {
        docs,
        looseName: nameApi.dataArgsType(name),
        manifest,
        strictName: nameApi.dataType(name),
    });

    if (!manifest.isEnum) {
        typeFragment.mergeImportsWith(manifest.strictType, manifest.looseType);
    }

    return typeFragment;
}
