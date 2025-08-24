import { pipe } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragment, fragmentFromTemplate, mergeFragmentImports } from '../utils';

export function getEnumLabelsFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        manifest: TypeManifest;
        name: string;
    },
): Fragment {
    const { manifest, name, nameApi } = scope;
    
    // Return empty fragment if not an enum
    if (!manifest.isEnum) {
        return fragment('');
    }
    
    // Extract variant names from the strictType content
    // The strictType for scalar enums is in the format: { VariantOne, VariantTwo, ... }
    const strictTypeContent = manifest.strictType.content;
    const variantMatches = strictTypeContent.match(/\w+/g);
    
    if (!variantMatches) {
        return fragment('');
    }
    
    // Generate the labels mapping
    const labels = variantMatches
        .map(variant => `    [${nameApi.dataType(name)}.${variant}]: '${variant}'`)
        .join(',\n');
    
    return fragment(labels);
}

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
            labelsFragment: getEnumLabelsFragment(scope),
            labelsName: nameApi.enumLabels(name),
            looseName: nameApi.dataArgsType(name),
            manifest,
            strictName: nameApi.dataType(name),
        }),
        f =>
            !manifest.isEnum ? mergeFragmentImports(f, [manifest.strictType.imports, manifest.looseType.imports]) : f,
    );
}
