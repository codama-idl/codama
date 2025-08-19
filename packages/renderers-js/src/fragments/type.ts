import { pipe } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragmentFromTemplate, mergeFragmentImports } from '../utils';

export function getTypeFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        docs?: string[];
        manifest: TypeManifest;
        name: string;
    },
): Fragment {
    const { name, manifest, nameApi, docs = [] } = scope;
    return pipe(
        fragmentFromTemplate('type.njk', {
            docs,
            looseName: nameApi.dataArgsType(name),
            manifest,
            strictName: nameApi.dataType(name),
        }),
        f =>
            !manifest.isEnum ? mergeFragmentImports(f, [manifest.strictType.imports, manifest.looseType.imports]) : f,
    );
}
